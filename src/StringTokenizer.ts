import Tokenizer, { TokenizerChunk } from './Tokenizer';
import CharNode from './CharNode';

export type StringTokenizerMatcher = { type: string, matches: string | string[] };

export type StringTokenizerMatcherNormalized = { type: string, matches: string[] };

export type StringTokenizerGreedyMatcher = {
  type: string,
  startsWith: string,
  endsWith?: string,
  haltsWith?: string,
  escapesWith?: string,
};

export type StringTokenizerConfig = {
  keywords?: Array<string | StringTokenizerMatcher>,
  punctuation?: Array<string | StringTokenizerMatcher>,
  greedyMatchers?: StringTokenizerGreedyMatcher[],
  delimiters: Array<string | StringTokenizerMatcher>,
  floatsHaveLeadingNumber?: boolean,
};

const EOF = '';
const DECIMAL_POINT = '.';

export default class StringTokenizer extends Tokenizer {

  readonly rootNode = new CharNode();

  protected stateNode = this.rootNode;

  protected buffer = '';


  constructor(config: StringTokenizerConfig) {
    super();
    const { defaultKeywordType, defaultPunctuationType, defaultDelimiterType } = StringTokenizer;
    const { identifierType, numberType, numberFloatType, haltedTypePrefix, unknownType } = StringTokenizer;
    const { charIsNumber, charIsStartOfIdentifier, charIsInIdentifier } = StringTokenizer;
    const keywords = StringTokenizer.normalizeDefs(config.keywords || [], defaultKeywordType);
    const punctuation = StringTokenizer.normalizeDefs(config.punctuation || [], defaultPunctuationType);
    const delimiters = StringTokenizer.normalizeDefs(config.delimiters || [], defaultDelimiterType);
    const delimitersWithEOF = delimiters.concat({ type: StringTokenizer.defaultDelimiterType, matches: [EOF] });
    const greedyMatchers = config.greedyMatchers || [];
    const floatsHaveLeadingNumber = config.floatsHaveLeadingNumber || false;

    const waitToTokenize = (node: CharNode, type: string): void => {
      this.sendOnceEncountered(node, type, delimitersWithEOF);
      this.sendOnceEncountered(node, type, punctuation);
    };

    const unknownNode = new CharNode();
    waitToTokenize(unknownNode, unknownType);

    const identifierNode = new CharNode();
    identifierNode.getDefaultChild = (char) => charIsInIdentifier(char) ? identifierNode : unknownNode;
    waitToTokenize(identifierNode, identifierType);

    const numberNode = new CharNode();
    numberNode.getDefaultChild = (char) => charIsNumber(char) ? numberNode : unknownNode;
    waitToTokenize(numberNode, numberType);

    const numberFloatNode = numberNode.addChild(DECIMAL_POINT);
    numberFloatNode.getDefaultChild = (char) => charIsNumber(char) ? numberFloatNode : unknownNode;
    waitToTokenize(numberFloatNode, numberFloatType);

    keywords.forEach(
      (keyword) => keyword.matches.forEach(
        (value) => {
          let node = this.rootNode;
          [...value].forEach((char: string) => {
            node = node.addChild(char);
            waitToTokenize(node, identifierType);
          });
          node.getDefaultChild = identifierNode.getDefaultChild;
          waitToTokenize(node, keyword.type);
        },
      ),
    );
    greedyMatchers?.forEach(
      ({ type, startsWith, endsWith = '', haltsWith = '', escapesWith = '' }) => {
        const haltedType = `${haltedTypePrefix}${type}`;
        const node = this.rootNode.addDescendant(startsWith);
        if (!endsWith) return waitToTokenize(node, type);
        this.sendImmediately(node, haltedType, EOF);
        escapesWith ? this.sendIfNotEscaped(node, type, endsWith, escapesWith) : this.sendImmediately(node, type, endsWith);
        if (!haltsWith) return;
        escapesWith ? this.sendIfNotEscaped(node, haltedType, haltsWith, escapesWith) : this.sendImmediately(node, haltedType, haltsWith);
      },
    );
    delimiters?.forEach(
      ({ type, matches }) => matches.forEach(
        (value) => {
          const node = this.rootNode.addDescendant(value);
          node.execute = () => this.send(value, type);
        },
      ),
    );
    punctuation?.forEach(
      ({ type, matches }) => matches.forEach(
        (value) => {
          const node = this.rootNode.addDescendant(value);
          node.getDefaultChild = (char) => {
            this.send(value, type);
            return this.rootNode.getChild(char);
          };
        },
      ),
    );
    if (!floatsHaveLeadingNumber) {
      this.rootNode.children.set(DECIMAL_POINT, numberFloatNode);
    }
    this.rootNode.getDefaultChild = (char: string) => {
      if (charIsStartOfIdentifier(char)) return identifierNode;
      if (charIsNumber(char)) return numberNode;
      return unknownNode;
    };
  }

  transform(chunk: TokenizerChunk) {
    const str = `${this.buffer}${chunk.toString()}`;
    const length = str.length;
    const startPosition = this.position;
    for (let currentIndex = this.buffer.length; currentIndex < length; currentIndex++) {
      const char = str.charAt(currentIndex);
      this.stateNode = this.stateNode.getChild(char);
      this.stateNode.execute(str, this.position - startPosition, currentIndex);
    }
    this.buffer = str.substring(this.position - startPosition);
  }

  flush() {
    this.stateNode = this.stateNode.getChild(EOF);
    this.stateNode.execute(this.buffer, 0, this.buffer.length);
  }

  reset(position = 0) {
    this.position = position;
    this.stateNode = this.rootNode;
    this.buffer = '';
  }

  protected send(value: string, type?: string): void {
    super.send(value, type);
    this.stateNode = this.rootNode;
  }

  protected sendImmediately(node: CharNode, type: string, encountered: string): void {
    const encounteredNode = node.addDescendant(encountered);
    encounteredNode.execute = (str, startIndex, currentIndex) => {
      const value = str.substring(startIndex, currentIndex + 1);
      this.send(value, type);
    };
  }

  protected sendOnceEncountered(node: CharNode, type: string, encountered: StringTokenizerMatcherNormalized[]): void {
    encountered.forEach(
      ({ matches }) => matches.forEach(
        (encounteredValue) => {
          const encounteredNode = node.addDescendant(encounteredValue);
          encounteredNode.execute = (str, startIndex, currentIndex) => {
            const value = str.substring(startIndex, (currentIndex + 1) - encounteredValue.length);
            this.send(value, type);
            this.stateNode = this.rootNode.getDescendant(encounteredValue);
            this.stateNode.execute(str, startIndex, currentIndex);
          };
        },
      ),
    );
  }

  protected sendIfNotEscaped(node: CharNode, type: string, encountered: string, escapeChar: string): void {
    const encounteredNode = node.addDescendant(encountered);
    encounteredNode.execute = (str, startIndex, currentIndex) => {
      let escapeIndex = currentIndex - encountered.length;
      let numInstances = 0;
      while (escapeIndex >= 0) {
        if (str.charAt(escapeIndex) != escapeChar) {
          break;
        }
        numInstances++;
        escapeIndex--;
      }
      const escaped = numInstances % 2;
      if (!numInstances || !escaped) {
        const value = str.substring(startIndex, currentIndex + 1);
        this.send(value, type);
      }
    };
  }

  static defaultKeywordType = 'KEYWORD';

  static defaultPunctuationType = 'PUNCTUATION';

  static defaultDelimiterType = 'DELIMITER';

  static identifierType = 'IDENTIFIER';

  static numberType = 'NUMBER';

  static numberFloatType = this.numberType;

  static haltedTypePrefix = 'HALTED_';

  static unknownType = 'UNKNOWN';

  static charIsLetter = (char: string) => (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');

  static charIsNumber = (char: string) => (char >= '0' && char <= '9');

  static charIsStartOfIdentifier = (char: string) => char === '_' || this.charIsLetter(char);

  static charIsInIdentifier = (char: string) => char === '_' || this.charIsLetter(char) || this.charIsNumber(char);

  static normalizeDefs(defs: Array<string | StringTokenizerMatcher>, defaultType: string): StringTokenizerMatcherNormalized[] {
    return defs.map((def) => {
      if (typeof def === 'string') {
        return { type: defaultType, matches: [def] };
      }
      return { ...def, matches: Array.isArray(def.matches) ? def.matches : [def.matches] };
    });
  }
}


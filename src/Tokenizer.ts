import { TransformCallback, TransformOptions } from 'stream';
import { Transformer } from 'node:stream/web';
import CharNode from './CharNode';

export type TokenizerChunk = { toString: () => string };

export type TokenizerToken = { value: string, position: number, type: string };

export type TokenizerEmitter = (token: TokenizerToken) => void;

export type TokenizerCharTest = (char: string) => boolean;

export type TokenizerMatcher = { type: string, matches: string | string[] };

export type TokenizerGreedyMatcher = {
  type: string,
  startsWith: string,
  endsWith?: string,
  haltsWith?: string,
  escapesWith?: string,
  subConfig?: TokenizerConfig,
};

export type TokenizerConfig = {
  unnamedKeywordType?: string,
  unnamedPunctuationType?: string,
  unnamedDelimiterType?: string,
  identifierType?: string,
  numberType?: string,
  numberFloatType?: string,
  haltedTypePrefix?: string,
  unknownType?: string,
  charIsStartOfIdentifier?: TokenizerCharTest,
  charIsInIdentifier?: TokenizerCharTest,
  keywords?: Array<string | TokenizerMatcher>,
  punctuation?: Array<string | TokenizerMatcher>,
  delimiters?: Array<string | TokenizerMatcher>,
  greedyMatchers?: TokenizerGreedyMatcher[],
  floatsHaveLeadingNumber?: boolean,
};

export type TokenizerMatcherNormalized = { type: string, matches: string[] };

const EOF = '';
const DECIMAL_POINT = '.';

export default class Tokenizer {

  protected readonly config: TokenizerConfig;

  protected readonly rootNode = new CharNode();

  protected readonly unknownNode = new CharNode();

  protected readonly identifierNode = new CharNode();

  protected readonly numberNode = new CharNode();

  protected stateNode = this.rootNode;

  protected buffer = '';

  protected position = 0;

  protected forEachToken: TokenizerEmitter = () => {};

  constructor(config: TokenizerConfig) {
    const unnamedKeywordType = config.unnamedKeywordType || Tokenizer.defaultKeywordType;
    const unnamedPunctuationType = config.unnamedPunctuationType || Tokenizer.defaultPunctuationType;
    const unnamedDelimiterType = config.unnamedDelimiterType || Tokenizer.defaultDelimiterType;
    const identifierType = config.identifierType || Tokenizer.defaultIdentifierType;
    const numberType = config.numberType || Tokenizer.defaultNumberType;
    const numberFloatType = config.numberFloatType || Tokenizer.defaultNumberFloatType;
    const haltedTypePrefix = config.haltedTypePrefix || Tokenizer.defaultHaltedTypePrefix;
    const unknownType = config.unknownType || Tokenizer.defaultUnknownType;
    const charIsStartOfIdentifier = config.charIsStartOfIdentifier || Tokenizer.defaultCharIsStartOfIdentifier;
    const charIsInIdentifier = config.charIsInIdentifier || Tokenizer.defaultCharIsInIdentifier;
    const keywords = Tokenizer.normalizeDefs(config.keywords || [], unnamedKeywordType);
    const punctuation = Tokenizer.normalizeDefs(config.punctuation || [], unnamedPunctuationType);
    const delimiters = Tokenizer.normalizeDefs(config.delimiters || [], unnamedDelimiterType);
    const delimitersWithEOF = delimiters.concat({ type: unnamedDelimiterType, matches: [EOF] });
    const greedyMatchers = config.greedyMatchers || [];
    const floatsHaveLeadingNumber = config.floatsHaveLeadingNumber || false;
    const { unknownNode, identifierNode, numberNode } = this;
    const numberFloatNode = numberNode.addChild(DECIMAL_POINT);
    // Indicates we should wait for either a delimiter or punctuation before tokenizing the buffer.
    const waitToTokenize = (node: CharNode, type: string): void => {
      this.sendOnceEncountered(node, type, delimitersWithEOF);
      this.sendOnceEncountered(node, type, punctuation);
      this.sendOnceEncountered(node, type, Tokenizer.normalizeDefs(
        greedyMatchers.map(({ startsWith }) => startsWith),
        '',
      ));
    };
    waitToTokenize(unknownNode, unknownType);
    // These either continue to be what they are if they pass their test, or they become unknown.
    identifierNode.getDefaultChild = (char) => charIsInIdentifier(char) ? identifierNode : unknownNode;
    waitToTokenize(identifierNode, identifierType);
    numberNode.getDefaultChild = (char) => Tokenizer.charIsNumber(char) ? numberNode : unknownNode;
    waitToTokenize(numberNode, numberType);
    numberFloatNode.getDefaultChild = (char) => Tokenizer.charIsNumber(char) ? numberFloatNode : unknownNode;
    waitToTokenize(numberFloatNode, numberFloatType);

    keywords.forEach(
      (keyword) => keyword.matches.forEach(
        (value) => {
          const couldBeIdentifier = charIsStartOfIdentifier(value[0]);
          let node = this.rootNode;
          [...value].forEach((char) => {
            node = node.addChild(char);
            // If a keyword is cut short, it decays into another type.
            waitToTokenize(node, couldBeIdentifier ? identifierType : unknownType);
          });
          // If a keyword goes beyond its characters, it decays into another type.
          node.getDefaultChild = couldBeIdentifier ? identifierNode.getDefaultChild : unknownNode.getDefaultChild;
          waitToTokenize(node, keyword.type);
        },
      ),
    );
    punctuation.forEach(
      ({ type, matches }) => matches.forEach(
        (value) => {
          const node = this.rootNode.addDescendant(value);
          // Only send punctuation after it ends, and immediately decay to a node dictated by the next character.
          node.getDefaultChild = (char) => {
            this.send(value, type);
            return this.rootNode.getChild(char);
          };
        },
      ),
    );
    delimiters.forEach(
      ({ type, matches }) => matches.forEach(
        (value) => {
          const node = this.rootNode.addDescendant(value);
          node.execute = () => this.send(value, type);
        },
      ),
    );
    greedyMatchers.forEach(
      ({ type, startsWith, endsWith, haltsWith, escapesWith, subConfig }) => {
        const haltedType = `${haltedTypePrefix}${type}`;
        const node = this.rootNode.addDescendant(startsWith);
        const subTokenizer = subConfig ? new Tokenizer(subConfig) : undefined;
        if (subTokenizer) {
          node.execute = (str, startIndex, currentIndex) => subTokenizer.transform(str[currentIndex]);
          subTokenizer.forEachToken = (token) => this.forEachToken({ ...token, position: token.position + this.position });
        }
        // End on a delimiter or punctuation if no explicit ending is specified.
        if (!endsWith) return waitToTokenize(node, type);
        // Create a halted token if we reach the end without completing the match.
        this.sendIfNotEscaped(node, haltedType, EOF);
        // Complete the match when we encounter the unescaped end.
        this.sendIfNotEscaped(node, type, endsWith, escapesWith, subTokenizer);
        if (!haltsWith) return;
        // If a halt is specified, create a halted token when we encounter the unescaped halt.
        this.sendIfNotEscaped(node, haltedType, haltsWith, escapesWith);
      },
    );
    if (!floatsHaveLeadingNumber) {
      this.rootNode.children.set(DECIMAL_POINT, numberFloatNode);
    }
    this.rootNode.getDefaultChild = (char) => {
      if (charIsStartOfIdentifier(char)) return identifierNode;
      if (Tokenizer.charIsNumber(char)) return numberNode;
      return unknownNode;
    };
    this.config = config;
  }

  /**
   * Accepts the next chunk of the input in a stream.
   */
  protected transform(chunk: TokenizerChunk): void {
    const str = `${this.buffer}${chunk.toString()}`;
    const length = str.length;
    const startPosition = this.position;
    for (let currentIndex = this.buffer.length; currentIndex < length; currentIndex++) {
      this.stateNode = this.stateNode.getChild(str[currentIndex]);
      this.stateNode.execute(str, this.position - startPosition, currentIndex);
    }
    this.buffer = str.substring(this.position - startPosition);
  }

  /**
   * Call when the stream ends to flush whichever tokens remain in the buffer.
   */
  protected flush(): void {
    this.stateNode = this.stateNode.getChild(EOF);
    this.stateNode.execute(this.buffer, 0, this.buffer.length);
  }

  /**
   * Resets the tokenizer's state so that it can be reused.
   */
  protected reset(position = 0, forEachToken = this.forEachToken): void {
    this.forEachToken = forEachToken;
    this.position = position;
    this.stateNode = this.rootNode;
    this.buffer = '';
  }

  /**
   * Sends the next token.
   */
  protected send(value: string, type: string): void {
    if (value && type) this.forEachToken({ value, type, position: this.position });
    this.position += value.length;
    this.stateNode = this.rootNode;
  }

  /**
   * Sends the current token as soon as we come across the string specified by "encountered" that is not escaped,
   * which is treated as part of the token.
   *
   * Currently, this method backtracks, as the assumption is that escapes rarely happen
   * v.s. the additional overhead of always keeping track of the number of escape characters encountered prior.
   * We can revisit this tradeoff once measured.
   */
  protected sendIfNotEscaped(node: CharNode, type: string, encountered: string, escapeChar = '', subTokenizer?: Tokenizer): void {
    const encounteredNode = node.addDescendant(encountered);
    encounteredNode.execute = (str, startIndex, currentIndex) => {
      subTokenizer?.transform(str[currentIndex]);
      let escapeIndex = currentIndex - encountered.length;
      let numInstances = 0;
      while (escapeChar && escapeIndex >= 0) {
        if (str[escapeIndex] != escapeChar) {
          break;
        }
        numInstances++;
        escapeIndex--;
      }
      const escaped = numInstances % 2;
      if (!numInstances || !escaped) {
        if (subTokenizer) {
          subTokenizer.flush();
          subTokenizer.reset();
        }
        const value = str.substring(startIndex, currentIndex + 1);
        this.send(value, type);
      }
    };
  }

  /**
   * Sends the current token as soon as we come across any of the tokens specified by "encountered",
   * which are separate tokens from the current.
   *
   * E.g. sending the current token if punctuation or delimiter tokens are encountered.
   */
  protected sendOnceEncountered(node: CharNode, type: string, encountered: TokenizerMatcherNormalized[]): void {
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

  /**
   * Parses a string in its entirety. Use when you have the full string already.
   */
  tokenize(str: TokenizerChunk): TokenizerToken[] {
    const tokens: TokenizerToken[] = [];
    this.reset();
    this.forEachToken = (token) => tokens.push(token);
    this.transform(str);
    this.flush();
    return tokens;
  }

  /**
   * Options for a Node.js Transform stream constructor.
   */
  get nodeTransformStreamOptions(): TransformOptions {
    return {
      transform: (chunk: TokenizerChunk, encoding: BufferEncoding, callback: TransformCallback) => {
        this.forEachToken = (token) => callback(null, token);
        this.transform(chunk);
      },
      flush: (callback: TransformCallback) => {
        this.forEachToken = (token) => callback(null, token);
        this.flush();
      },
    };
  }

  /**
   * Options for a web Transform stream constructor.
   */
  get webTransformStreamOptions(): Transformer<TokenizerChunk, TokenizerToken> {
    return {
      transform: (chunk, controller) => {
        this.forEachToken = (token) => controller.enqueue(token);
        this.transform(chunk);
      },
      flush: (controller) => {
        this.forEachToken = (token) => controller.enqueue(token);
        this.flush();
      },
    };
  }

  static readonly defaultKeywordType = 'KEYWORD';

  static readonly defaultPunctuationType = 'PUNCTUATION';

  static readonly defaultDelimiterType = '';

  static readonly defaultIdentifierType = 'IDENTIFIER';

  static readonly defaultNumberType = 'NUMBER';

  static readonly defaultNumberFloatType = this.defaultNumberType;

  static readonly defaultHaltedTypePrefix = 'HALTED_';

  static readonly defaultUnknownType = 'UNKNOWN';

  static readonly defaultCharIsStartOfIdentifier: TokenizerCharTest = (char: string) =>
    char === '_' ||
    this.charIsLetter(char);

  static readonly defaultCharIsInIdentifier: TokenizerCharTest = (char: string) =>
    char === '_' ||
    this.charIsLetter(char) ||
    this.charIsNumber(char);

  protected static normalizeDefs(defs: Array<string | TokenizerMatcher>, defaultType: string): TokenizerMatcherNormalized[] {
    return defs.map((def) => {
      if (typeof def === 'string') {
        return { type: defaultType, matches: [def] };
      }
      return { ...def, matches: Array.isArray(def.matches) ? def.matches : [def.matches] };
    });
  }

  protected static charIsLetter(char: string) {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  protected static charIsNumber(char: string) {
    return (char >= '0' && char <= '9');
  }
}


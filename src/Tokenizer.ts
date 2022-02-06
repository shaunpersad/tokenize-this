import { TransformCallback, TransformOptions } from 'stream';
import { Transformer } from 'node:stream/web';
import CharNode from './CharNode';

export type TokenizerChunk = { toString: () => string };

export type TokenizerToken = { value: string, position: number, type: string };

export type TokenizerTokenTransformer = (token: TokenizerToken) => TokenizerToken[];

export type TokenizerEmitter = (token: TokenizerToken) => void;

export type TokenizerMatcher = { type: string, matches: string | string[] };

export type TokenizerGreedyMatcher = {
  type: string,
  startsWith: string,
  endsWith?: string,
  haltsWith?: string,
  escapesWith?: string,
};

export type TokenizerConfig = {
  keywords?: Array<string | TokenizerMatcher>,
  punctuation?: Array<string | TokenizerMatcher>,
  greedyMatchers?: TokenizerGreedyMatcher[],
  delimiters: Array<string | TokenizerMatcher>,
  floatsHaveLeadingNumber?: boolean,
  includeUnnamedDelimiters?: boolean,
  transformer?: TokenizerTokenTransformer,
};

export type TokenizerMatcherNormalized = { type: string, matches: string[] };

const EOF = '';
const DECIMAL_POINT = '.';
const noOp = () => {};

export default class Tokenizer {

  protected readonly config: TokenizerConfig;

  protected readonly rootNode = new CharNode();

  protected readonly unknownNode = new CharNode();

  protected readonly identifierNode = new CharNode();

  protected readonly numberNode = new CharNode();

  protected stateNode = this.rootNode;

  protected buffer = '';

  protected position = 0;

  protected forEachToken: TokenizerEmitter = noOp;

  constructor(config: TokenizerConfig) {
    const { defaultKeywordType, defaultPunctuationType, defaultDelimiterType } = Tokenizer;
    const { identifierType, numberType, numberFloatType, haltedTypePrefix, unknownType } = Tokenizer;
    const { charIsNumber, charIsStartOfIdentifier, charIsInIdentifier } = Tokenizer;
    const keywords = Tokenizer.normalizeDefs(config.keywords || [], defaultKeywordType);
    const punctuation = Tokenizer.normalizeDefs(config.punctuation || [], defaultPunctuationType);
    const delimiters = Tokenizer.normalizeDefs(config.delimiters || [], defaultDelimiterType);
    const delimitersWithEOF = delimiters.concat({ type: defaultDelimiterType, matches: [EOF] });
    const greedyMatchers = config.greedyMatchers || [];
    const floatsHaveLeadingNumber = config.floatsHaveLeadingNumber || false;
    const { unknownNode, identifierNode, numberNode } = this;
    const numberFloatNode = numberNode.addChild(DECIMAL_POINT);
    // Indicates we should wait for either a delimiter or punctuation before tokenizing the buffer.
    const waitToTokenize = (node: CharNode, type: string): void => {
      this.sendOnceEncountered(node, type, delimitersWithEOF);
      this.sendOnceEncountered(node, type, punctuation);
    };
    waitToTokenize(unknownNode, unknownType);
    // These either continue to be what they are if they pass their test, or they become unknown.
    identifierNode.getDefaultChild = (char) => charIsInIdentifier(char) ? identifierNode : unknownNode;
    waitToTokenize(identifierNode, identifierType);
    numberNode.getDefaultChild = (char) => charIsNumber(char) ? numberNode : unknownNode;
    waitToTokenize(numberNode, numberType);
    numberFloatNode.getDefaultChild = (char) => charIsNumber(char) ? numberFloatNode : unknownNode;
    waitToTokenize(numberFloatNode, numberFloatType);

    keywords.forEach(
      (keyword) => keyword.matches.forEach(
        (value) => {
          let node = this.rootNode;
          [...value].forEach((char) => {
            node = node.addChild(char);
            // If a keyword is cut short, it becomes an identifier.
            waitToTokenize(node, identifierType);
          });
          // Keywords decay into identifiers if there are more characters present in the token.
          node.getDefaultChild = identifierNode.getDefaultChild;
          waitToTokenize(node, keyword.type);
        },
      ),
    );
    greedyMatchers.forEach(
      ({ type, startsWith, endsWith = '', haltsWith = '', escapesWith = '' }) => {
        const haltedType = `${haltedTypePrefix}${type}`;
        const node = this.rootNode.addDescendant(startsWith);
        // End on a delimiter or punctuation if no explicit ending is specified.
        if (!endsWith) return waitToTokenize(node, type);
        // Create a halted token if we reach the end without completing the match.
        this.sendImmediately(node, haltedType, EOF);
        // Complete the match when we encounter the unescaped end.
        escapesWith ? this.sendIfNotEscaped(node, type, endsWith, escapesWith) : this.sendImmediately(node, type, endsWith);
        if (!haltsWith) return;
        // If a halt is specified, create a halted token when we encounter the unescaped halt.
        escapesWith ? this.sendIfNotEscaped(node, haltedType, haltsWith, escapesWith) : this.sendImmediately(node, haltedType, haltsWith);
      },
    );
    delimiters.forEach(
      ({ type, matches }) => matches.forEach(
        (value) => {
          const node = this.rootNode.addDescendant(value);
          node.execute = () => this.send(value, type);
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
    if (!floatsHaveLeadingNumber) {
      this.rootNode.children.set(DECIMAL_POINT, numberFloatNode);
    }
    this.rootNode.getDefaultChild = (char) => {
      if (charIsStartOfIdentifier(char)) return identifierNode;
      if (charIsNumber(char)) return numberNode;
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
  protected reset(position = 0): void {
    this.forEachToken = noOp;
    this.position = position;
    this.stateNode = this.rootNode;
    this.buffer = '';
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

  /**
   * Sends the next token.
   */
  protected send(value: string, type: string): void {
    const { config, position } = this;
    const { includeUnnamedDelimiters, transformer } = config;
    if (value && (type !== Tokenizer.defaultDelimiterType || includeUnnamedDelimiters)) {
      if (transformer) {
        const tokens = transformer({ value, type, position });
        for (let x = 0; x < tokens.length; x++) {
          const token = tokens[x];
          token.value && this.forEachToken(token);
        }
      } else {
        this.forEachToken({ value, type, position });
      }
    }
    this.position += value.length;
    this.stateNode = this.rootNode;
  }

  /**
   * Sends the current token as soon as we come across the string specified by "encountered",
   * which is treated as part of the token.
   */
  protected sendImmediately(node: CharNode, type: string, encountered: string): void {
    const encounteredNode = node.addDescendant(encountered);
    encounteredNode.execute = (str, startIndex, currentIndex) => {
      const value = str.substring(startIndex, currentIndex + 1);
      this.send(value, type);
    };
  }

  /**
   * Sends the current token as soon as we come across the string specified by "encountered" that is not escaped,
   * which is treated as part of the token.
   *
   * Currently, this method backtracks, as the assumption is that escapes rarely happen
   * v.s. the additional overhead of always keeping track of the number of escape characters encountered prior.
   * We can revisit this tradeoff once measured.
   */
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

  static readonly defaultKeywordType = 'KEYWORD';

  static readonly defaultPunctuationType = 'PUNCTUATION';

  static readonly defaultDelimiterType = 'DELIMITER';

  static readonly identifierType = 'IDENTIFIER';

  static readonly numberType = 'NUMBER';

  static readonly numberFloatType = this.numberType;

  static readonly haltedTypePrefix = 'HALTED_';

  static readonly unknownType = 'UNKNOWN';

  static readonly charIsLetter = (char: string) => (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');

  static readonly charIsNumber = (char: string) => (char >= '0' && char <= '9');

  static readonly charIsStartOfIdentifier = (char: string) => char === '_' || this.charIsLetter(char);

  static readonly charIsInIdentifier = (char: string) => char === '_' || this.charIsLetter(char) || this.charIsNumber(char);

  protected static normalizeDefs(defs: Array<string | TokenizerMatcher>, defaultType: string): TokenizerMatcherNormalized[] {
    return defs.map((def) => {
      if (typeof def === 'string') {
        return { type: defaultType, matches: [def] };
      }
      return { ...def, matches: Array.isArray(def.matches) ? def.matches : [def.matches] };
    });
  }
}


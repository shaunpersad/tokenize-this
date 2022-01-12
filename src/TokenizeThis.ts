import { TransformCallback, TransformOptions } from 'stream';
import { Transformer } from 'node:stream/web';
import Tokenizer, { TokenizerConfig, TokenizerEmitter, TokenizerToken } from './Tokenizer';

export default class TokenizeThis {
  readonly config: TokenizerConfig;

  constructor(config: TokenizerConfig) {
    this.config = config;
  }

  tokenize(str: string, forEachToken: TokenizerEmitter): void {
    const tokenizer = new Tokenizer(this.config, forEachToken);
    tokenizer.consume(str);
    tokenizer.flush();
  }

  nodeTransformStreamOptions(): TransformOptions {
    const tokenizer = new Tokenizer(this.config);
    return {
      transform(chunk: Buffer | string, encoding: BufferEncoding, callback: TransformCallback) {
        tokenizer.forEachToken = (token) => callback(null, token);
        tokenizer.consume(chunk);
      },
      flush(callback: TransformCallback) {
        tokenizer.forEachToken = (token) => callback(null, token);
        tokenizer.flush();
      },
    };
  }

  webTransformStreamOptions(): Transformer<Buffer | string, TokenizerToken> {
    const tokenizer = new Tokenizer(this.config);
    return {
      transform(chunk, controller) {
        tokenizer.forEachToken = (token) => controller.enqueue(token);
        tokenizer.consume(chunk);
      },
      flush(controller) {
        tokenizer.forEachToken = (token) => controller.enqueue(token);
        tokenizer.flush();
      },
    };
  }

  static fromDefaultConfig(): TokenizeThis {
    return new this(this.defaultConfig);
  }

  static get defaultConfig(): TokenizerConfig {

    return {
      matchers: [
        {
          type: 'NUMBER',
          query: /-?(\d*\.)?\d+\b/,
        },
        {
          type: 'BOOLEAN',
          query: /\btrue|false\b/,
        },
        {
          type: 'SEPARATOR',
          query: /[,(){}\/\\:]/,
        },
        {
          type: 'OPERATOR',
          query: /\*|%|\+|-|!=|=|!|<=|>=|<|>|\^|&{1,2}|\|{1,2}/,
        },
        {
          type: 'IDENTIFIER',
          query: /\b[a-zA-Z_][a-zA-Z_0-9]*/,
        },
      ],
      greedyMatchers: [
        {
          type: 'DOUBLE_QUOTED_STRING',
          query: { openedBy: /"/, closedBy: /(?<!\\)(?:\\\\)*"/, haltedBy: /(?<!\\)(?:\\\\)*\n/ },
        },
        {
          type: 'SINGLE_QUOTED_STRING',
          query: { openedBy: /'/, closedBy: /(?<!\\)(?:\\\\)*'/, haltedBy: /(?<!\\)(?:\\\\)*\n/ },
        },
        {
          type: 'BACKTICK_STRING',
          query: { openedBy: /`/, closedBy: /(?<!\\)(?:\\\\)*`/ },
        },
        {
          type: 'SINGLE_LINE_COMMENT',
          query: { openedBy: /\/\//, closedBy: /\n/ },
        },
        {
          type: 'MULTI_LINE_COMMENT',
          query: { openedBy: /\/\*/, closedBy: /\*\// },
        },

      ],
      delimiters: /\s+/,
    };
  }
}

import { Transform } from 'stream';
import { TransformStream } from 'node:stream/web';
import Tokenizer, { NEW_LINE, TokenizerCallback, TokenizerConfig, TokenizerResult } from './Tokenizer';

export default class TokenizeThis {
  readonly config: TokenizerConfig;

  constructor(config: TokenizerConfig) {
    this.config = config;
  }

  tokenizeString(str: string, callback: TokenizerCallback): void {
    const tokenizer = new Tokenizer(this.config);
    tokenizer.transform(str, 'utf8', callback);
    tokenizer.flush(callback);
  }

  tokenizeNodeStream(): Transform {
    const tokenizer = new Tokenizer(this.config);
    return new Transform(tokenizer);
  }

  tokenizeWebStream(): TransformStream<string, TokenizerResult> {
    const tokenizer = new Tokenizer(this.config);
    return new TransformStream<string, TokenizerResult>({
      transform(chunk, controller) {
        tokenizer.transform(chunk, 'utf8', (err, tokenizeResult) => {
          err ? controller.error(err) : controller.enqueue(tokenizeResult);
        });
      },
    });
  }

  static fromDefaultConfig(): TokenizeThis {
    return new this(this.defaultConfig);
  }

  static get defaultConfig(): TokenizerConfig {
    return {
      matchers: [
        {
          query: /-?(\d*\.)?\d+\b/,
          type: 'NUMBER',
        },
        {
          query: NEW_LINE,
          type: 'NEWLINE',
        },
        {
          query: /,/,
          type: 'COMMA',
        },
        {
          query: /\*/,
          type: 'ASTERISK',
        },
        {
          query: /\//,
          type: 'FORWARD_SLASH',
        },
        {
          query: /\\/,
          type: 'BACK_SLASH',
        },
        {
          query: /%/,
          type: 'PERCENT',
        },
        {
          query: /\+/,
          type: 'PLUS',
        },
        {
          query: /-/,
          type: 'MINUS',
        },
        {
          query: /!=/,
          type: 'NOT_EQUAL',
        },
        {
          query: /=/,
          type: 'EQUAL',
        },
        {
          query: /!/,
          type: 'EXCLAMATION',
        },
        {
          query: /<=/,
          type: 'LESS_THAN_OR_EQUAL_TO',
        },
        {
          query: />=/,
          type: 'GREATER_THAN_OR_EQUAL_TO',
        },
        {
          query: /</,
          type: 'LESS_THAN',
        },
        {
          query: />/,
          type: 'GREATER_THAN',
        },
        {
          query: /\^/,
          type: 'CARET',
        },
      ],
      expressionEnclosures: ['{', '}', '(', ')'],
      stringEnclosures: ['"', "'", '`'],
      stringEscapeChar: '\\',
      delimiters: /\s+/,
    };
  }
}

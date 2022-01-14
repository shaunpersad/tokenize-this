import { TransformCallback, TransformOptions } from 'stream';
import { Transformer } from 'node:stream/web';
import Tokenizer, { TokenizerConfig, TokenizerEmitter, TokenizerToken } from './Tokenizer';
import { config as commonConfig } from './config/common';

type NearleyInfo = { lastIndex: number, position: number, buffer: string };

export default class TokenizeThis {
  readonly config: TokenizerConfig;

  constructor(config: TokenizerConfig = commonConfig) {
    this.config = config;
  }

  /**
   * Use when you already have the full string and are ready to process the entire thing at once.
   */
  tokenize(str: string | Buffer, forEachToken: TokenizerEmitter): void {
    const tokenizer = new Tokenizer(this.config);
    tokenizer.transform(str, forEachToken);
    tokenizer.flush(forEachToken);
  }

  /**
   * Creates an object that can be passed to a Node.js Transform constructor to create a Transform stream. e.g.:
   * ```
   * import { Transform } from 'stream';
   * const tokenizeThis = new TokenizeThis();
   * const tokenizer = new Transform(tokenizeThis.nodeTransformStreamOptions());
   * textReader.pipe(tokenizer).pipe(parser);
   * ```
   */
  nodeTransformStreamOptions(): TransformOptions {
    const tokenizer = new Tokenizer(this.config);
    return {
      transform(chunk: Buffer | string, encoding: BufferEncoding, callback: TransformCallback) {
        tokenizer.transform(chunk, (token) => callback(null, token));
      },
      flush(callback: TransformCallback) {
        tokenizer.flush((token) => callback(null, token));
      },
    };
  }

  /**
   * Creates an object that can be passed to a web TransformStream constructor to create a Transform stream. e.g.:
   * ```
   * import { TransformStream } from 'stream/web';
   * const tokenizeThis = new TokenizeThis();
   * const tokenizer = new TransformStream(tokenizeThis.webTransformStreamOptions());
   * textReader.pipeThrough(tokenizer).pipeTo(parser);
   * ```
   */
  webTransformStreamOptions(): Transformer<Buffer | string, TokenizerToken> {
    const tokenizer = new Tokenizer(this.config);
    return {
      transform(chunk, controller) {
        tokenizer.transform(chunk, (token) => controller.enqueue(token));
      },
      flush(controller) {
        tokenizer.flush((token) => controller.enqueue(token));
      },
    };
  }

  nearleyCompat(formatError: (token: TokenizerToken, tokens: TokenizerToken[], tokenIndex: number) => string) {
    const tokenizer = new Tokenizer(this.config);
    const tokens: TokenizerToken[] = [];
    const setTokens = (token: TokenizerToken) => tokens.push(token);
    let tokenIndex = 0;
    return {
      next() {
        return tokenIndex < tokens.length ? tokens[tokenIndex++] : null;
      },
      save(): NearleyInfo {
        const { query: { lastIndex }, position, buffer } = tokenizer;
        return { lastIndex, position, buffer };
      },
      reset(chunk: string, { lastIndex, position, buffer }: NearleyInfo) {
        tokenIndex = 0;
        tokenizer.query.lastIndex = lastIndex;
        tokenizer.position = position;
        tokenizer.buffer = buffer;
        tokenizer.transform(chunk, setTokens);
        tokenizer.flush(setTokens);
      },
      formatError(token: TokenizerToken) {
        return formatError(token, tokens, tokenIndex);
      },
      has(name: string) {
        return tokenizer.types.includes(name);
      },
    };
  }

}

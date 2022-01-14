import { TransformCallback, TransformOptions } from 'stream';
import { Transformer } from 'node:stream/web';
import Tokenizer, { TokenizerConfig, TokenizerToken } from './Tokenizer';
import { config as commonConfig } from './config/common';

type ErrorFormatter = (token: TokenizerToken, tokens: TokenizerToken[], tokenIndex: number) => string;

export default class TokenizeThis {

  static tokenizer(config: TokenizerConfig = commonConfig): Tokenizer {
    return new Tokenizer(config);
  }

  /**
   * Creates an object that can be passed to a Node.js Transform constructor to create a Transform stream.
   *
   * ```
   * import { Transform } from 'stream';
   * const tokenizeThis = new TokenizeThis();
   * const tokenizer = new Transform(tokenizeThis.nodeTransformStreamOptions());
   * textReader.pipe(tokenizer).pipe(parser);
   * ```
   */
  static nodeTransformStreamOptions(tokenizer: Tokenizer): TransformOptions {
    return {
      transform(chunk: string | Buffer, encoding: BufferEncoding, callback: TransformCallback) {
        tokenizer.transform(chunk, (token) => callback(null, token));
      },
      flush(callback: TransformCallback) {
        tokenizer.flush((token) => callback(null, token));
      },
    };
  }

  /**
   * Creates an object that can be passed to a web TransformStream constructor to create a Transform stream.
   *
   * ```
   * import { TransformStream } from 'stream/web';
   * const tokenizeThis = new TokenizeThis();
   * const tokenizer = new TransformStream(tokenizeThis.webTransformStreamOptions());
   * textReader.pipeThrough(tokenizer).pipeTo(parser);
   * ```
   */
  static webTransformStreamOptions(tokenizer: Tokenizer): Transformer<string | Buffer, TokenizerToken> {
    return {
      transform(chunk, controller) {
        tokenizer.transform(chunk, (token) => controller.enqueue(token));
      },
      flush(controller) {
        tokenizer.flush((token) => controller.enqueue(token));
      },
    };
  }

  static nearleyCompat(tokenizer: Tokenizer, formatError: ErrorFormatter) {
    let tokenIndex = 0;
    let tokens: TokenizerToken[] = [];
    const setTokens = (token: TokenizerToken) => tokens.push(token);
    return {
      next() {
        return tokenIndex < tokens.length ? tokens[tokenIndex++] : null;
      },
      save(): number {
        return tokenIndex - 1;
      },
      reset(chunk: string, index: number) {
        const token = tokens[index];
        tokenIndex = 0;
        tokens = [];
        tokenizer.resetTo(token);
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

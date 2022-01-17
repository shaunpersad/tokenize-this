export type TokenizerChunk = string | Buffer;

export type TokenizerToken = { value: string, position: number, type?: string };

export type TokenizerEmitter = (token: TokenizerToken) => void;

export default abstract class Tokenizer {
  protected position = 0;

  public forEachToken: TokenizerEmitter = () => {};

  /**
   * Processes the next chunk of the string stream.
   */
  abstract transform(chunk: TokenizerChunk): void;
  /**
   * Call when the stream has ended.
   */
  abstract flush(): void;
  // /**
  //  * Allows us to reset back to a particular token.
  //  */
  // abstract reset(beforeToken?: TokenizerToken | null): void;
  /**
   * Parses a string in its entirety. Use when you have the full string already.
   */
  tokenize(str: TokenizerChunk) {
    this.transform(str);
    this.flush();
  }

  /**
   * Calls the emitter with the next token.
   */
  protected send(value: string, type?: string): void {
    const { position } = this;
    if (value) this.forEachToken({ value, position, type });
    this.position += value.length;
  }
}

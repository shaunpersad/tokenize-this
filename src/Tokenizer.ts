import { TransformOptions } from 'stream';

export const NEW_LINE = /(\r\n|\r|\n)/;

export type TokenizerResult =
  { token: string } |
  { token: string, type: string } |
  { isEnclosure: true } |
  { stringEnclosure: string };

export type TokenizerCallback = (error?: Error | null, data?: TokenizerResult) => void;

export type TokenizerMatcher = {
  query: string | RegExp,
  type: string,
};

export type TokenizerConfig = {
  matchers: TokenizerMatcher[],
  expressionEnclosures: string[],
  stringEnclosures: string[],
  stringEscapeChar: string,
  delimiters: RegExp,
};


export default class Tokenizer implements TransformOptions {
  protected readonly config: TokenizerConfig;

  protected stringOpener = '';

  protected buffer = '';

  constructor(config: TokenizerConfig) {
    this.config = config;
  }

  transform(chunk: Buffer | string, encoding: BufferEncoding, callback: TokenizerCallback): void {
    for (const char of chunk.toString()) {
      this.processChar(char, callback);
    }
  }

  flush(callback: TokenizerCallback): void {
    let winner;
    while (winner = this.getWinner(this.buffer)) {
      const before = this.buffer.slice(0, winner.index);
      before && callback(null, { token: before });
      callback(null, { token: winner.token, type: winner.type });
      this.buffer = this.buffer.slice(winner.index + winner.token.length);
    }
    this.buffer && callback(null, { token: this.buffer });
    this.buffer = '';
  }

  protected processChar(char: string, callback: TokenizerCallback): void {
    const { stringOpener, buffer, config } = this;
    const { stringEscapeChar } = config;
    const str = `${buffer}${char}`;

    if (stringOpener) {
      if (char === stringOpener &&
        (!buffer.endsWith(stringEscapeChar) || !buffer.endsWith(`${stringEscapeChar}${stringEscapeChar}`))
      ) {
        callback(null, { token: buffer, stringEnclosure: stringOpener });
        this.stringOpener = '';
        this.buffer = '';
        return;
      }
      this.buffer = str;
      return;
    }

    for (const enclosure of config.stringEnclosures) { //TODO support regex/multi-char enclosures
      if (char !== enclosure) {
        continue;
      }
      this.flush(callback);
      this.stringOpener = enclosure;
      return;
    }

    for (const enclosure of config.expressionEnclosures) {
      if (char !== enclosure) {
        continue;
      }
      this.flush(callback);
      callback(null, { token: char, isEnclosure: true });
      return;
    }

    const matchedDelimiter = str.match(config.delimiters);
    if (matchedDelimiter) {
      this.buffer = str.slice(0, matchedDelimiter.index);
      this.flush(callback);
      return;
    }
    this.buffer = str;
  }

  protected getWinner(str: string) {
    if (!str) {
      return null;
    }
    let winningIndex = Infinity;
    let winningToken = '';
    let winningMatcher: TokenizerMatcher | null = null;
    for (const matcher of this.config.matchers) {
      const match = str.match(matcher.query);
      if (!match) {
        continue;
      }
      const index = match.index as number;
      const [token] = match;
      if (index <= winningIndex && token.length > winningToken.length) {
        winningIndex = index;
        winningToken = token;
        winningMatcher = matcher;
      }
    }
    return winningToken ? {
      index: winningIndex,
      token: winningToken,
      type: winningMatcher!.type,
    } : null;
  }
}

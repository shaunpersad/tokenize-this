import { TransformOptions } from 'stream';

export const NEW_LINE = /(\r\n|\r|\n)/;

export type TokenizerResult = {
  token: string,
  type?: string
};

export type TokenizerCallback = (error?: Error | null, data?: TokenizerResult) => void;

export type TokenizerMatcher = {
  query: string | RegExp,
  type?: string
};

export type TokenizerConfig = {
  matchers: TokenizerMatcher[],
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

  transform(chunk: Buffer | string, encoding: BufferEncoding, callback: TokenizerCallback) {
    for (const char of chunk.toString()) {
      this.processCharacter(char, callback);
    }
  }

  flush(callback: TokenizerCallback) {
    const { buffer } = this;
    if (!buffer) {
      return;
    }
    const winner = this.getWinner(buffer);
    if (!winner) {
      callback(null, { token: buffer });
      return;
    }
    const [before, after] = buffer.split(winner.matcher!.query);
    before && callback(null, { token: before });
    callback(null, { token: winner.token, type: winner.matcher!.type });
    after && callback(null, { token: after });
  }

  protected processCharacter(char: string, callback: TokenizerCallback) {
    const { stringOpener, buffer, config } = this;
    const { stringEscapeChar } = config;
    const str = `${buffer}${char}`;

    if (stringOpener) {
      if (char === stringOpener &&
        (!buffer.endsWith(stringEscapeChar) || !buffer.endsWith(`${stringEscapeChar}${stringEscapeChar}`))
      ) {
        callback(null, { token: buffer, type: stringOpener });
        this.stringOpener = '';
        this.buffer = '';
        return;
      }
      this.buffer = str;
      return;
    }

    for (const enclosure of config.stringEnclosures) {
      if (char !== enclosure) {
        continue;
      }
      this.flush(callback);
      this.stringOpener = enclosure;
      this.buffer = '';
      return;
    }

    const matchedDelimiter = str.match(config.delimiters);
    if (matchedDelimiter) {
      this.buffer = str.slice(0, matchedDelimiter.index);
      this.flush(callback);
      this.buffer = '';
      return;
    }

    const winner = this.getWinner(str);
    if (!winner) {
      this.buffer = str;
      return;
    }
    if (winner.index + winner.token.length === str.length) {
      this.buffer = str;
      return;
    }
    const [before, after] = str.split(winner.matcher!.query);
    before && callback(null, { token: before });
    callback(null, { token: winner.token, type: winner.matcher?.type });
    this.buffer = after;
  }

  protected getWinner(str: string) {
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
      matcher: winningMatcher,
    } : null;
  }
}

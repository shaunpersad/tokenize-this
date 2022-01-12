export type TokenizerToken = { value: string, type?: string };

export type TokenizerEmitter = (token: TokenizerToken) => void;

export type TokenizerMatcher = {
  type: string,
  query: RegExp,
};

export type TokenizerGreedyMatcher = {
  type: string,
  query: { openedBy: RegExp, closedBy: RegExp, haltedBy?: RegExp }
};

export type TokenizerConfig = {
  matchers: TokenizerMatcher[],
  greedyMatchers: TokenizerGreedyMatcher[],
  delimiters: RegExp,
};

type Winner = {
  index: number,
  token: string,
  type: string,
};

export default class Tokenizer {

  protected buffer = '';

  protected readonly greedyMatchers: TokenizerGreedyMatcher[] = [];

  protected readonly matchers: TokenizerMatcher[] = [];

  protected readonly delimiters: RegExp;

  forEachToken: TokenizerEmitter;

  constructor({ matchers, greedyMatchers, delimiters }: TokenizerConfig, forEachToken: TokenizerEmitter = () => {}) {
    this.greedyMatchers = greedyMatchers;
    this.matchers = matchers;
    this.delimiters = delimiters;
    this.forEachToken = forEachToken;
  }

  consume(chunk: Buffer | string): void {
    for (const char of chunk.toString('utf8')) {
      this.buffer = `${this.buffer}${char}`;
      let winner;
      while (winner = this.getGreedyWinner(this.buffer)) {
        this.buffer = this.buffer.slice(0, winner.index);
        this.flush();
        this.send(winner.token, winner.type);
        this.buffer = this.buffer.slice(winner.index + winner.token.length);
      }
      if (winner === false) {
        continue;
      }
      const match = this.buffer.match(this.delimiters);
      if (match) {
        this.buffer = this.buffer.slice(0, match.index);
        this.flush();
      }
    }
  }

  flush(): void {
    let winner;
    while (winner = this.getWinner(this.buffer)) {
      const before = this.buffer.slice(0, winner.index);
      this.send(before);
      this.send(winner.token, winner.type);
      this.buffer = this.buffer.slice(winner.index + winner.token.length);
    }
    this.send(this.buffer);
    this.buffer = '';
  }

  send(value: string, type?: string): void {
    value && this.forEachToken({ value, type });
  }

  protected getGreedyWinner(str: string): Winner | null | false {
    if (!str) {
      return null;
    }
    let winningIndex = Infinity;
    let winningToken = '';
    let winningType = '';
    for (const { type, query } of this.greedyMatchers) {
      const { openedBy, closedBy, haltedBy } = query;
      const openMatch = str.match(openedBy);
      if (!openMatch) {
        continue;
      }
      const index = openMatch.index as number;
      const remainder = str.slice(index + openMatch.length);
      if (haltedBy?.test(remainder)) {
        continue;
      }
      const closedMatch = remainder.match(closedBy);
      if (!closedMatch) {
        return false;
      }
      const token = str.slice(index, index + openMatch.length + closedMatch.index! + closedMatch[0].length);
      if (index < winningIndex || (index === winningIndex && token.length > winningToken.length)) {
        winningIndex = index;
        winningToken = token;
        winningType = type;
      }
    }
    return winningToken ? {
      index: winningIndex,
      token: winningToken,
      type: winningType,
    } : null;
  }

  protected getWinner(str: string): Winner | null {
    if (!str) {
      return null;
    }
    let winningIndex = Infinity;
    let winningToken = '';
    let winningType = '';
    for (const { query, type } of this.matchers) {
      const match = str.match(query);
      if (!match) {
        continue;
      }
      const index = match.index as number;
      const [token] = match;
      if (index < winningIndex || (index === winningIndex && token.length > winningToken.length)) {
        winningIndex = index;
        winningToken = token;
        winningType = type;
      }
    }
    return winningToken ? {
      index: winningIndex,
      token: winningToken,
      type: winningType,
    } : null;
  }
}

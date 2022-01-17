export type TokenizerState = { position: number, buffer: string };

export type TokenizerToken = { state: TokenizerState, value: string, type?: string };

export type TokenizerEmitter = (token: TokenizerToken) => void;

export type TokenizerMatcher = { type: string, query: RegExp };

export type TokenizerGreedyMatcherQuery = { openedBy: RegExp, closedBy: RegExp };

export type TokenizerGreedyMatcher = { type: string, query: TokenizerGreedyMatcherQuery };

export type TokenizerConfig = {
  matchers: TokenizerMatcher[],
  greedyMatchers: TokenizerGreedyMatcher[],
  delimiters: RegExp,
  delimiterType?: string,
};

export default class RegexTokenizer {

  readonly types: string[] = [];

  readonly delimiterType?: string;

  readonly query: RegExp;

  position = 0;

  buffer = '';

  constructor({ matchers, greedyMatchers, delimiters, delimiterType }: TokenizerConfig) {
    this.delimiterType = delimiterType;
    this.query = new RegExp(
      greedyMatchers
        .flatMap(
          ({ type, query }) => {
            const { openedBy, closedBy } = query;
            this.types.push(type, '');
            return [`(${openedBy.source}${closedBy.source})`, `(${openedBy.source})`];
          },
        )
        .concat(
          matchers.map(({ type, query }) => {
            this.types.push(type);
            return `(${query.source})`;
          },
          ),
        )
        .concat(`(${delimiters.source})`)
        .join('|'),
      'g',
    );
  }

  get state(): TokenizerState {
    const { position, buffer } = this;
    return { position, buffer };
  }


  transform(chunk: string | Buffer, forEachToken: TokenizerEmitter): void {
    this.query.lastIndex = 0;
    const { query, buffer, types, delimiterType } = this;
    const str = `${buffer}${chunk.toString('utf8')}`;
    const numTypes = types.length;
    let lastEndIndex = 0;
    let lastState = this.state;
    let match;
    while (match = query.exec(str)) {
      const value = match[0];
      const { index } = match;
      if (index - lastEndIndex) this.send(forEachToken, str.substring(lastEndIndex, index), lastState);
      for (let x = 0; x < numTypes; x++) {
        if (match[x + 1] !== undefined) {
          if (types[x]) {
            this.send(forEachToken, value, lastState, types[x]);
          } else { // ignore the partial greedy match
            query.lastIndex = lastEndIndex; // reset back to the beginning of the greedy match
          }
          break;
        }
      }
      if (match[numTypes + 1] !== undefined) { // we hit a delimiter
        delimiterType ? this.send(forEachToken, value, lastState, delimiterType) : this.position += value.length;
      }
      lastEndIndex = index + value.length;
      lastState = this.state;
    }
    this.buffer = str.substring(lastEndIndex);
  }

  /**
   * Call when the stream has ended.
   */
  flush(forEachToken: TokenizerEmitter): void {
    this.send(forEachToken, this.buffer);
  }

  /**
   * Allows us to reset back to a particular token.
   */
  resetTo(token?: TokenizerToken | null): void {
    this.position = !token ? 0 : token.state.position + token.value.length;
    this.buffer = !token ? '' : token.state.buffer;
  }

  /**
   * Parses a string in its entirety. Use when you have the full string already.
   */
  tokenize(chunk: string | Buffer, forEachToken: TokenizerEmitter) {
    this.transform(chunk, forEachToken);
    this.flush(forEachToken);
  }

  /**
   * Calls the emitter with the next token.
   */
  protected send(forEachToken: TokenizerEmitter, value: string, state = this.state, type?: string): void {
    if (value) forEachToken({ state, value, type });
    this.position += value.length;
  }
}

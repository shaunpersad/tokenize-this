export type TokenizerToken = { value: string, position: number, type?: string };

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

export default class Tokenizer {

  readonly types: string[] = [];

  readonly delimiterType?: string;

  readonly query: RegExp;

  position = 0;

  buffer = ''; // holds a portion of the string stream for processing.

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

  /**
   * Processes the next chunk of the string stream.
   */
  transform(chunk: string | Buffer, forEachToken: TokenizerEmitter): void {
    const { buffer, query, types, delimiterType } = this;
    const str = `${buffer}${chunk.toString('utf8')}`;
    const numTypes = types.length;
    let lastEndIndex = 0;
    let match;
    while (match = query.exec(str)) {
      const value = match[0];
      const { index } = match;
      if (index - lastEndIndex) this.send(forEachToken, str.substring(lastEndIndex, index));
      for (let x = 0; x < numTypes; x++) {
        if (match[x + 1] !== undefined) {
          if (types[x]){
            this.send(forEachToken, value, types[x]); // ignore the partial greedy match
          } else {
            query.lastIndex = lastEndIndex; // reset back to the beginning of the greedy match
          }
          break;
        }
      }
      lastEndIndex = index + value.length;
      if (match[numTypes + 1] !== undefined) { // we hit a delimiter
        delimiterType ? this.send(forEachToken, value, delimiterType) : this.position += value.length;
      }
    }
    this.buffer = str.substring(lastEndIndex);
    this.query.lastIndex = 0;
  }

  /**
   * Call whenever it's time to turn the entirety of the current buffer into tokens.
   */
  flush(forEachToken: TokenizerEmitter): void {
    this.send(forEachToken, this.buffer);
    this.buffer = '';
    this.query.lastIndex = 0;
  }

  /**
   * Calls the emitter with the next token.
   */
  protected send(forEachToken: TokenizerEmitter, value: string, type?: string): void {
    const { position } = this;
    if (value) forEachToken({ value, position, type }); // only send if there's actually a value.
    this.position += value.length;
  }
}

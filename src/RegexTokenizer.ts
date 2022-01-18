import Tokenizer, { TokenizerChunk } from './Tokenizer';

export type RegexTokenizerMatcher = { type: string, matches: RegExp };

export type RegexTokenizerGreedyMatcher = { type: string, startsWith: RegExp, endsWith: RegExp };

export type RegexTokenizerConfig = {
  matchers?: RegexTokenizerMatcher[],
  greedyMatchers?: RegexTokenizerGreedyMatcher[],
  delimiters: RegExp,
};

export default class RegexTokenizer extends Tokenizer {

  readonly types: string[] = [];

  readonly query: RegExp;

  position = 0;

  buffer = '';

  constructor({ matchers = [], greedyMatchers = [], delimiters }: RegexTokenizerConfig) {
    super();
    this.query = new RegExp(
      greedyMatchers
        .flatMap(
          ({ type, startsWith, endsWith }) => {
            this.types.push(type, '');
            return [`(${startsWith.source}${endsWith.source})`, `(${startsWith.source})`];
          },
        )
        .concat(
          matchers.map(({ type, matches }) => {
            this.types.push(type);
            return `(${matches.source})`;
          },
          ),
        )
        .concat(`(${delimiters.source})`)
        .join('|'),
      'g',
    );
  }

  transform(chunk: TokenizerChunk): void {
    const { query, buffer, types } = this;
    const str = `${buffer}${chunk.toString('utf8')}`;
    const numTypes = types.length;
    let lastEndIndex = 0;
    let match;
    query.lastIndex = 0;
    while (match = query.exec(str)) {
      const value = match[0];
      const { index } = match;
      if (index - lastEndIndex) this.send(str.substring(lastEndIndex, index));
      for (let x = 0; x < numTypes; x++) {
        if (match[x + 1] !== undefined) {
          if (types[x]) {
            this.send(value, types[x]);
          } else { // ignore the partial greedy match
            query.lastIndex = lastEndIndex; // reset back to the beginning of the greedy match
          }
          break;
        }
      }
      if (match[numTypes + 1] !== undefined) { // we hit a delimiter
        this.send(value, RegexTokenizer.defaultDelimiterType);
      }
      lastEndIndex = index + value.length;
    }
    this.buffer = str.substring(lastEndIndex);
  }

  flush(): void {
    this.send(this.buffer);
  }

  reset(position = 0): void {
    this.position = position;
    this.buffer = '';
  }

  protected send(value: string, type = RegexTokenizer.unknownType) {
    super.send(value, type);
  }

  static defaultDelimiterType = 'DELIMITER';

  static unknownType = 'UNKNOWN';
}

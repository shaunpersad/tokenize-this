import StringTokenizer, { StringTokenizerConfig } from '../src/StringTokenizer';

describe('StringTokenizer', () => {
  const config: StringTokenizerConfig = {
    keywords: ['this', 'null', 'true', 'false'],
    punctuation: [
      '[', ',', '(', ')', '{', '}', ':', ']',
      '?', '%', '+', '-', '*', '/', '!=', '=', '!', '<=', '>=', '<', '>', '^', '&&', '&', '||', '|',
    ],
    delimiters: [' ', '\n', '\r', '\t'],
    matchers: [
      { type: 'DOUBLE_QUOTED_STRING', startsWith: '"', endsWith: '"', haltsWith: '\n', escapeHaltsWith: '\\' },
      { type: 'SINGLE_QUOTED_STRING', startsWith: "'", endsWith: "'", haltsWith: '\n', escapeHaltsWith: '\\' },
      { type: 'BACKTICK_STRING', startsWith: '`', endsWith: '`' },
      { type: 'SINGLE_LINE_COMMENT', startsWith: '//', endsWith: '\n' },
      { type: 'MULTI_LINE_COMMENT', startsWith: '/*', endsWith: '*/' },
    ],
  };
  it('does some stuff', () => {
    const str = 'Tokenize! 1111 5 1s && || & | ||| "str" \n this! "esc\\"" and <= = (>= =)true false true{!=} 5!=1 !!! -5 -6 - 1 "string (with ) some {enclosure()}" {"inside" } var1: :var2 var3';
    const tokenizer = new StringTokenizer(config);
    tokenizer.forEachToken = console.log;
    tokenizer.tokenize(str);
  });
});

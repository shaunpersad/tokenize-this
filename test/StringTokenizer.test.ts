import StringTokenizer, { StringTokenizerConfig } from '../src/StringTokenizer';

describe('StringTokenizer', () => {
  const config: StringTokenizerConfig = {
    keywords: [
      { type: 'BOOLEAN', matches: ['true', 'false'] },
      { type: 'NULL', matches: 'null' },
      'this',
    ],
    punctuation: [
      {
        type:'OPERATOR',
        matches: [ '?', '%', '+', '-', '*', '/', '!=', '=', '!', '<=', '>=', '<', '>', '^', '&&', '&', '||', '|'],
      },
      { type: 'ASSIGNMENT', matches: ':' },
      '[', ',', '(', ')', '{', '}',  ']',
    ],
    greedyMatchers: [
      { type: 'DOUBLE_QUOTED_STRING', startsWith: '"', endsWith: '"', haltsWith: '\n', escapesWith: '\\' },
      { type: 'SINGLE_QUOTED_STRING', startsWith: "'", endsWith: "'", haltsWith: '\n', escapesWith: '\\' },
      { type: 'BACKTICK_STRING', startsWith: '`', endsWith: '`' },
      { type: 'SINGLE_LINE_COMMENT', startsWith: '//', endsWith: '\n' },
      { type: 'MULTI_LINE_COMMENT', startsWith: '/*', endsWith: '*/' },
    ],
    delimiters: [
      { type: 'NEWLINE', matches: '\n' },
      ' ', '\r', '\t',
    ],
  };
  it('does some stuff', () => {
    // const str = 'true truee tru this 0.1 1.0 .1 1}\n }';
    const str = 'Tokenize! 1111 5 1s && || & | ||| "str" \n this! "esc\\"" and <= = (>= =)true false true{!=} 5!=1 !!! -5 -6 - 1 "string (with ) some {enclosure()}" {"inside" } var1: :var2 var3';
    const tokenizer = new StringTokenizer(config);
    tokenizer.forEachToken = console.log;
    tokenizer.tokenize(str);
  });
});

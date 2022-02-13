import { expect } from 'chai';
import Tokenizer from '../src/Tokenizer';

describe('Examples', () => {

  it('Math', () => {
    const tokenizer = new Tokenizer({
      keywords: [
        'gcd', // unnamed keyword
      ],
      punctuation: [
        // named punctuation
        { type: 'OPERATOR', matches: ['+', '-', '/'] },
        { type: 'PAREN_OPEN', matches: '(' },
        { type: 'PAREN_CLOSE', matches: ')' },
        ',', // unnamed punctuation
      ],
      delimiters: [
        '\n', ' ', '\r', '\t', // unnamed delimiters
      ],
    });
    const str = '5 + 6 -(4/2) + gcd(10 * 2, 5)';
    const tokens = tokenizer.tokenize(str);
    expect(tokens).to.eql([
      { value: '5', type: 'NUMBER', position: 0 },
      { value: '+', type: 'OPERATOR', position: 2 },
      { value: '6', type: 'NUMBER', position: 4 },
      { value: '-', type: 'OPERATOR', position: 6 },
      { value: '(', type: 'PAREN_OPEN', position: 7 },
      { value: '4', type: 'NUMBER', position: 8 },
      { value: '/', type: 'OPERATOR', position: 9 },
      { value: '2', type: 'NUMBER', position: 10 },
      { value: ')', type: 'PAREN_CLOSE', position: 11 },
      { value: '+', type: 'OPERATOR', position: 13 },
      { value: 'gcd', type: 'KEYWORD', position: 15 },
      { value: '(', type: 'PAREN_OPEN', position: 18 },
      { value: '10', type: 'NUMBER', position: 19 },
      { value: '*', type: 'UNKNOWN', position: 22 },
      { value: '2', type: 'NUMBER', position: 24 },
      { value: ',', type: 'PUNCTUATION', position: 25 },
      { value: '5', type: 'NUMBER', position: 27 },
      { value: ')', type: 'PAREN_CLOSE', position: 28 },
    ]);
  });

  it('SQL', () => {
    const tokenizer = new Tokenizer({
      keywords: [
        { type: 'FUNCTION', matches: 'COUNT' },
        { type: 'BOOLEAN', matches: ['TRUE', 'FALSE'] },
        { type: 'NULL', matches: 'NULL' },
        'SELECT', 'FROM', 'WHERE', 'AND', 'IS',
      ],
      punctuation: [
        { type: 'OPERATOR', matches: ['+', '='] },
        { type: 'PAREN_OPEN', matches: '(' },
        { type: 'PAREN_CLOSE', matches: ')' },
        ',',
      ],
      delimiters: [
        '\n', ' ', '\r', '\t',
      ],
      greedyMatchers: [
        { type: 'DOUBLE_QUOTED_STRING', startsWith: '"', endsWith: '"', haltsWith: '\n', escapesWith: '\\' },
        { type: 'SINGLE_QUOTED_STRING', startsWith: "'", endsWith: "'", haltsWith: '\n', escapesWith: '\\' },
      ],
    });
    const str =
      `SELECT COUNT(id), 5+6
       FROM users
       WHERE name = "shaun persad"
       AND foo = "escaped\\""
       AND hobby IS NULL`;
    const tokens = tokenizer.tokenize(str);
    expect(tokens).to.eql([
      { value: 'SELECT', type: 'KEYWORD', position: 0 },
      { value: 'COUNT', type: 'FUNCTION', position: 7 },
      { value: '(', type: 'PAREN_OPEN', position: 12 },
      { value: 'id', type: 'IDENTIFIER', position: 13 },
      { value: ')', type: 'PAREN_CLOSE', position: 15 },
      { value: ',', type: 'PUNCTUATION', position: 16 },
      { value: '5', type: 'NUMBER', position: 18 },
      { value: '+', type: 'OPERATOR', position: 19 },
      { value: '6', type: 'NUMBER', position: 20 },
      { value: 'FROM', type: 'KEYWORD', position: 29 },
      { value: 'users', type: 'IDENTIFIER', position: 34 },
      { value: 'WHERE', type: 'KEYWORD', position: 47 },
      { value: 'name', type: 'IDENTIFIER', position: 53 },
      { value: '=', type: 'OPERATOR', position: 58 },
      { value: '"shaun persad"', type: 'DOUBLE_QUOTED_STRING', position: 60 },
      { value: 'AND', type: 'KEYWORD', position: 82 },
      { value: 'foo', type: 'IDENTIFIER', position: 86 },
      { value: '=', type: 'OPERATOR', position: 90 },
      { value: '"escaped\\""', type: 'DOUBLE_QUOTED_STRING', position: 92 },
      { value: 'AND', type: 'KEYWORD', position: 111 },
      { value: 'hobby', type: 'IDENTIFIER', position: 115 },
      { value: 'IS', type: 'KEYWORD', position: 121 },
      { value: 'NULL', type: 'NULL', position: 124 },
    ]);
  });

  it('JSON', () => {
    const tokenizer = new Tokenizer({
      keywords: [
        { type: 'BOOLEAN', matches: ['true', 'false'] },
        { type: 'NULL', matches: 'null' },
      ],
      punctuation: [
        { type: 'ARRAY_OPEN', matches: '[' },
        { type: 'ARRAY_CLOSE', matches: ']' },
        { type: 'ITEM_SEPARATOR', matches: ',' },
        { type: 'OBJECT_OPEN', matches: '{' },
        { type: 'OBJECT_CLOSE', matches: '}' },
        { type: 'ASSIGNMENT', matches: ':' },
      ],
      delimiters: [
        '\n', ' ', '\r', '\t',
      ],
      greedyMatchers: [
        { type: 'STRING', startsWith: '"', endsWith: '"', escapesWith: '\\' },
      ],
    });
    const str = '{ "name": "Shaun Persad", "age": 33, "title": null, "hobbies": ["making tokenizers"], "enabled": true }';
    const tokens = tokenizer.tokenize(str);
    expect(tokens).to.eql([
      { value: '{', type: 'OBJECT_OPEN', position: 0 },
      { value: '"name"', type: 'STRING', position: 2 },
      { value: ':', type: 'ASSIGNMENT', position: 8 },
      { value: '"Shaun Persad"', type: 'STRING', position: 10 },
      { value: ',', type: 'ITEM_SEPARATOR', position: 24 },
      { value: '"age"', type: 'STRING', position: 26 },
      { value: ':', type: 'ASSIGNMENT', position: 31 },
      { value: '33', type: 'NUMBER', position: 33 },
      { value: ',', type: 'ITEM_SEPARATOR', position: 35 },
      { value: '"title"', type: 'STRING', position: 37 },
      { value: ':', type: 'ASSIGNMENT', position: 44 },
      { value: 'null', type: 'NULL', position: 46 },
      { value: ',', type: 'ITEM_SEPARATOR', position: 50 },
      { value: '"hobbies"', type: 'STRING', position: 52 },
      { value: ':', type: 'ASSIGNMENT', position: 61 },
      { value: '[', type: 'ARRAY_OPEN', position: 63 },
      { value: '"making tokenizers"', type: 'STRING', position: 64 },
      { value: ']', type: 'ARRAY_CLOSE', position: 83 },
      { value: ',', type: 'ITEM_SEPARATOR', position: 84 },
      { value: '"enabled"', type: 'STRING', position: 86 },
      { value: ':', type: 'ASSIGNMENT', position: 95 },
      { value: 'true', type: 'BOOLEAN', position: 97 },
      { value: '}', type: 'OBJECT_CLOSE', position: 102 },
    ]);
  });

  it('XML', () => {
    const tokenizer = new Tokenizer({
      charIsStartOfIdentifier: () => false,
      delimiters: [
        '\n', '\r', '\t',
      ],
      greedyMatchers: [
        {
          type: '', // leave empty to _not_emit this whole match as a single token
          startsWith: '<',
          endsWith: '>',
          subConfig: {
            punctuation: [
              '?', '!', '=', '<', '>', '/',
            ],
            delimiters: [
              '\n', ' ', '\r', '\t',
            ],
            greedyMatchers: [
              { type: 'STRING', startsWith: '"', endsWith: '"', escapesWith: '\\' },
              { type: 'STRING', startsWith: "'", endsWith: "'", escapesWith: '\\' },
            ],
            charIsInIdentifier: (char: string) => Tokenizer.defaultCharIsInIdentifier(char) ||
              char === ':' ||
              char === '.' ||
              char === '-',
          },
        },
      ],
    });
    const str =
      `<?xml-stylesheet href="catalog.xsl" type="text/xsl"?>
       <!DOCTYPE catalog SYSTEM "catalog.dtd">
       <catalog>
         <product description="Cardigan Sweater" product_image="cardigan.jpg">
            <size description="Large" />
            <color_swatch image="red_cardigan.jpg">
              Red cardigan
              Line two
            </color_swatch>
         </product>
      </catalog>`;
    // const str = '<foo>bar</foo>baz';
    const tokens = tokenizer
      .tokenize(str)
      .map(
        ({ type, value, position }) => ({ value: value.trim(), type, position }))
      .filter(
        ({ value }) => value,
      );
    expect(tokens).to.eql([
      { value: '<', type: 'PUNCTUATION', position: 0 },
      { value: '?', type: 'PUNCTUATION', position: 1 },
      { value: 'xml-stylesheet', type: 'IDENTIFIER', position: 2 },
      { value: 'href', type: 'IDENTIFIER', position: 17 },
      { value: '=', type: 'PUNCTUATION', position: 21 },
      { value: '"catalog.xsl"', type: 'STRING', position: 22 },
      { value: 'type', type: 'IDENTIFIER', position: 36 },
      { value: '=', type: 'PUNCTUATION', position: 40 },
      { value: '"text/xsl"', type: 'STRING', position: 41 },
      { value: '?', type: 'PUNCTUATION', position: 51 },
      { value: '>', type: 'PUNCTUATION', position: 52 },
      { value: '<', type: 'PUNCTUATION', position: 61 },
      { value: '!', type: 'PUNCTUATION', position: 62 },
      { value: 'DOCTYPE', type: 'IDENTIFIER', position: 63 },
      { value: 'catalog', type: 'IDENTIFIER', position: 71 },
      { value: 'SYSTEM', type: 'IDENTIFIER', position: 79 },
      { value: '"catalog.dtd"', type: 'STRING', position: 86 },
      { value: '>', type: 'PUNCTUATION', position: 99 },
      { value: '<', type: 'PUNCTUATION', position: 108 },
      { value: 'catalog', type: 'IDENTIFIER', position: 109 },
      { value: '>', type: 'PUNCTUATION', position: 116 },
      { value: '<', type: 'PUNCTUATION', position: 127 },
      { value: 'product', type: 'IDENTIFIER', position: 128 },
      { value: 'description', type: 'IDENTIFIER', position: 136 },
      { value: '=', type: 'PUNCTUATION', position: 147 },
      { value: '"Cardigan Sweater"', type: 'STRING', position: 148 },
      { value: 'product_image', type: 'IDENTIFIER', position: 167 },
      { value: '=', type: 'PUNCTUATION', position: 180 },
      { value: '"cardigan.jpg"', type: 'STRING', position: 181 },
      { value: '>', type: 'PUNCTUATION', position: 195 },
      { value: '<', type: 'PUNCTUATION', position: 209 },
      { value: 'size', type: 'IDENTIFIER', position: 210 },
      { value: 'description', type: 'IDENTIFIER', position: 215 },
      { value: '=', type: 'PUNCTUATION', position: 226 },
      { value: '"Large"', type: 'STRING', position: 227 },
      { value: '/', type: 'PUNCTUATION', position: 235 },
      { value: '>', type: 'PUNCTUATION', position: 236 },
      { value: '<', type: 'PUNCTUATION', position: 250 },
      { value: 'color_swatch', type: 'IDENTIFIER', position: 251 },
      { value: 'image', type: 'IDENTIFIER', position: 264 },
      { value: '=', type: 'PUNCTUATION', position: 269 },
      { value: '"red_cardigan.jpg"', type: 'STRING', position: 270 },
      { value: '>', type: 'PUNCTUATION', position: 288 },
      { value: 'Red cardigan', type: 'UNKNOWN', position: 290 },
      { value: 'Line two', type: 'UNKNOWN', position: 317 },
      { value: '<', type: 'PUNCTUATION', position: 352 },
      { value: '/', type: 'PUNCTUATION', position: 353 },
      { value: 'color_swatch', type: 'IDENTIFIER', position: 354 },
      { value: '>', type: 'PUNCTUATION', position: 366 },
      { value: '<', type: 'PUNCTUATION', position: 377 },
      { value: '/', type: 'PUNCTUATION', position: 378 },
      { value: 'product', type: 'IDENTIFIER', position: 379 },
      { value: '>', type: 'PUNCTUATION', position: 386 },
      { value: '<', type: 'PUNCTUATION', position: 394 },
      { value: '/', type: 'PUNCTUATION', position: 395 },
      { value: 'catalog', type: 'IDENTIFIER', position: 396 },
      { value: '>', type: 'PUNCTUATION', position: 403 },
    ]);
  });

  it('GraphQL', () => {
    const tokenizer = new Tokenizer({
      keywords: [
        'type',
      ],
      punctuation: [
        '{', '}', '!', ',',
      ],
      delimiters: [
        '\n', ' ', '\r', '\t',
      ],
      greedyMatchers: [
        { type: 'COMMENT', startsWith: '"""', endsWith: '"""' },
        { type: 'DIRECTIVE', startsWith: '@' },
        {
          type: '',
          startsWith: '(',
          endsWith: ')',
          subConfig: {
            keywords: [
              { type: 'BOOLEAN', matches: ['true', 'false'] },
            ],
            punctuation: [
              ':', ',', '[', ']', '(', ')', '!',
            ],
            delimiters: [
              '\n', ' ', '\r', '\t',
            ],
            greedyMatchers: [
              { type: 'STRING', startsWith: '"', endsWith: '"', escapesWith: '\\' },
            ],
          },
        },
      ],
    });
    const str = `
    type Mutation {
      """
      Does the thing.
      """
      doTheThing(id: ID!): Thing! @scope(has: ["things.do"])
    }
    `;
    const tokens = tokenizer.tokenize(str);
    expect(tokens).to.eql([
      { value: 'type', type: 'KEYWORD', position: 5 },
      { value: 'Mutation', type: 'IDENTIFIER', position: 10 },
      { value: '{', type: 'PUNCTUATION', position: 19 },
      { value: '"""\n      Does the thing.\n      """', type: 'COMMENT', position: 27 },
      { value: 'doTheThing', type: 'IDENTIFIER', position: 69 },
      { value: '(', type: 'PUNCTUATION', position: 79 },
      { value: 'id', type: 'IDENTIFIER', position: 80 },
      { value: ':', type: 'PUNCTUATION', position: 82 },
      { value: 'ID', type: 'IDENTIFIER', position: 84 },
      { value: '!', type: 'PUNCTUATION', position: 86 },
      { value: ')', type: 'PUNCTUATION', position: 87 },
      { value: ':', type: 'UNKNOWN', position: 88 },
      { value: 'Thing', type: 'IDENTIFIER', position: 90 },
      { value: '!', type: 'PUNCTUATION', position: 95 },
      { value: '@scope', type: 'DIRECTIVE', position: 97 },
      { value: '(', type: 'PUNCTUATION', position: 103 },
      { value: 'has', type: 'IDENTIFIER', position: 104 },
      { value: ':', type: 'PUNCTUATION', position: 107 },
      { value: '[', type: 'PUNCTUATION', position: 109 },
      { value: '"things.do"', type: 'STRING', position: 110 },
      { value: ']', type: 'PUNCTUATION', position: 121 },
      { value: ')', type: 'PUNCTUATION', position: 122 },
      { value: '}', type: 'PUNCTUATION', position: 128 },
    ]);
  });
});

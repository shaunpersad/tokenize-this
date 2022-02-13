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
        ({ type, value, position }) => ({ type, value: value.trim(), position }))
      .filter(
        ({ value }) => value,
      );
    expect(tokens).to.eql([
      { type: 'PUNCTUATION', value: '<', position: 0 },
      { type: 'PUNCTUATION', value: '?', position: 1 },
      { type: 'IDENTIFIER', value: 'xml-stylesheet', position: 2 },
      { type: 'IDENTIFIER', value: 'href', position: 17 },
      { type: 'PUNCTUATION', value: '=', position: 21 },
      { type: 'STRING', value: '"catalog.xsl"', position: 22 },
      { type: 'IDENTIFIER', value: 'type', position: 36 },
      { type: 'PUNCTUATION', value: '=', position: 40 },
      { type: 'STRING', value: '"text/xsl"', position: 41 },
      { type: 'PUNCTUATION', value: '?', position: 51 },
      { type: 'PUNCTUATION', value: '>', position: 52 },
      { type: 'PUNCTUATION', value: '<', position: 61 },
      { type: 'PUNCTUATION', value: '!', position: 62 },
      { type: 'IDENTIFIER', value: 'DOCTYPE', position: 63 },
      { type: 'IDENTIFIER', value: 'catalog', position: 71 },
      { type: 'IDENTIFIER', value: 'SYSTEM', position: 79 },
      { type: 'STRING', value: '"catalog.dtd"', position: 86 },
      { type: 'PUNCTUATION', value: '>', position: 99 },
      { type: 'PUNCTUATION', value: '<', position: 108 },
      { type: 'IDENTIFIER', value: 'catalog', position: 109 },
      { type: 'PUNCTUATION', value: '>', position: 116 },
      { type: 'PUNCTUATION', value: '<', position: 127 },
      { type: 'IDENTIFIER', value: 'product', position: 128 },
      { type: 'IDENTIFIER', value: 'description', position: 136 },
      { type: 'PUNCTUATION', value: '=', position: 147 },
      { type: 'STRING', value: '"Cardigan Sweater"', position: 148 },
      { type: 'IDENTIFIER', value: 'product_image', position: 167 },
      { type: 'PUNCTUATION', value: '=', position: 180 },
      { type: 'STRING', value: '"cardigan.jpg"', position: 181 },
      { type: 'PUNCTUATION', value: '>', position: 195 },
      { type: 'PUNCTUATION', value: '<', position: 209 },
      { type: 'IDENTIFIER', value: 'size', position: 210 },
      { type: 'IDENTIFIER', value: 'description', position: 215 },
      { type: 'PUNCTUATION', value: '=', position: 226 },
      { type: 'STRING', value: '"Large"', position: 227 },
      { type: 'PUNCTUATION', value: '/', position: 235 },
      { type: 'PUNCTUATION', value: '>', position: 236 },
      { type: 'PUNCTUATION', value: '<', position: 250 },
      { type: 'IDENTIFIER', value: 'color_swatch', position: 251 },
      { type: 'IDENTIFIER', value: 'image', position: 264 },
      { type: 'PUNCTUATION', value: '=', position: 269 },
      { type: 'STRING', value: '"red_cardigan.jpg"', position: 270 },
      { type: 'PUNCTUATION', value: '>', position: 288 },
      { type: 'UNKNOWN', value: 'Red cardigan', position: 290 },
      { type: 'UNKNOWN', value: 'Line two', position: 317 },
      { type: 'PUNCTUATION', value: '<', position: 352 },
      { type: 'PUNCTUATION', value: '/', position: 353 },
      { type: 'IDENTIFIER', value: 'color_swatch', position: 354 },
      { type: 'PUNCTUATION', value: '>', position: 366 },
      { type: 'PUNCTUATION', value: '<', position: 377 },
      { type: 'PUNCTUATION', value: '/', position: 378 },
      { type: 'IDENTIFIER', value: 'product', position: 379 },
      { type: 'PUNCTUATION', value: '>', position: 386 },
      { type: 'PUNCTUATION', value: '<', position: 394 },
      { type: 'PUNCTUATION', value: '/', position: 395 },
      { type: 'IDENTIFIER', value: 'catalog', position: 396 },
      { type: 'PUNCTUATION', value: '>', position: 403 },
    ]);
  });

  it('GraphQL', () => {
    const tokenizer = new Tokenizer({
      keywords: [
        { type: 'BOOLEAN', matches: ['true', 'false'] },
        'type',
      ],
      punctuation: [
        '[', ']', '(', ')', '{', '}', ':', ',', '!',
      ],
      delimiters: [
        '\n', ' ', '\r', '\t',
      ],
      greedyMatchers: [
        { type: 'STRING', startsWith: '"', endsWith: '"', escapesWith: '\\' },
        { type: 'COMMENT', startsWith: '"""', endsWith: '"""' },
        { type: 'DIRECTIVE', startsWith: '@' },
      ],
    });
    const str = `
    type Query {
      """
      Gets the thing.
      """
      geThing(id: ID!): Thing @scope(has: ["things.read"])
    }
    `;
    const tokens = tokenizer.tokenize(str);
    console.log(tokens);
  });
});

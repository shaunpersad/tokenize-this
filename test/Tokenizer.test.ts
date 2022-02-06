import { expect } from 'chai';
import Tokenizer from '../src/Tokenizer';

describe('Examples', () => {

  it('A math expression', () => {
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

  it('An SQL query', () => {
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
      ],
    });
    const str =
      `SELECT COUNT(id), 5+6
       FROM users
       WHERE name = "shaun persad"
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
      { value: 'hobby', type: 'IDENTIFIER', position: 86 },
      { value: 'IS', type: 'KEYWORD', position: 92 },
      { value: 'NULL', type: 'NULL', position: 95 },
    ]);
  });

  it('A JSON string', () => {
    const tokenizer = new Tokenizer({
      keywords: [
        { type: 'BOOLEAN', matches: ['true', 'false'] },
        { type: 'NULL', matches: 'null' },
      ],
      punctuation: [
        { type: 'ARRAY_OPEN', matches: '[' },
        { type: 'ARRAY_CLOSE', matches: ']' },
        { type: 'ARRAY_ITEM_SEPARATOR', matches: ',' },
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
      { value: ',', type: 'ARRAY_ITEM_SEPARATOR', position: 24 },
      { value: '"age"', type: 'STRING', position: 26 },
      { value: ':', type: 'ASSIGNMENT', position: 31 },
      { value: '33', type: 'NUMBER', position: 33 },
      { value: ',', type: 'ARRAY_ITEM_SEPARATOR', position: 35 },
      { value: '"title"', type: 'STRING', position: 37 },
      { value: ':', type: 'ASSIGNMENT', position: 44 },
      { value: 'null', type: 'NULL', position: 46 },
      { value: ',', type: 'ARRAY_ITEM_SEPARATOR', position: 50 },
      { value: '"hobbies"', type: 'STRING', position: 52 },
      { value: ':', type: 'ASSIGNMENT', position: 61 },
      { value: '[', type: 'ARRAY_OPEN', position: 63 },
      { value: '"making tokenizers"', type: 'STRING', position: 64 },
      { value: ']', type: 'ARRAY_CLOSE', position: 83 },
      { value: ',', type: 'ARRAY_ITEM_SEPARATOR', position: 84 },
      { value: '"enabled"', type: 'STRING', position: 86 },
      { value: ':', type: 'ASSIGNMENT', position: 95 },
      { value: 'true', type: 'BOOLEAN', position: 97 },
      { value: '}', type: 'OBJECT_CLOSE', position: 102 },
    ]);
  });

  it('An XML string', () => {
    // const content = '';
    // const contentPosition = 0;
    // const isCollectingContent = false;
    const tokenizer = new Tokenizer({
      punctuation: [
        { type: 'START_TAG_OPEN', matches: '<' },
        { type: 'START_TAG_SELF_CLOSE', matches: '/>' },
        { type: 'END_TAG_OPEN', matches: '</' },
        { type: 'TAG_CLOSE', matches: '>' },
        { type: 'PROCESSING_TAG_OPEN', matches: '<?' },
        { type: 'PROCESSING_TAG_CLOSE', matches: '?>' },
        { type: 'MARKUP_TAG_OPEN', matches: '<!' },
        { type: 'ASSIGNMENT', matches: '=' },
      ],
      delimiters: [
        '\n', ' ', '\r', '\t',
      ],
      greedyMatchers: [
        { type: 'DOUBLE_QUOTED_STRING', startsWith: '"', endsWith: '"', escapesWith: '\\' },
        { type: 'SINGLE_QUOTED_STRING', startsWith: "'", endsWith: "'", escapesWith: '\\' },
        { type: 'TEXT', startsWith: '>', endsWith: '<' },
      ],
      // unnamedDelimiterType: 'DELIMITER',
      charIsInIdentifier: (char: string) => Tokenizer.defaultCharIsInIdentifier(char) ||
        char === ':' ||
        char === '.' ||
        char === '-',
      // transformer: (token) => {
      //   if (isCollectingContent) {
      //     if (token.type.endsWith('_OPEN')) { // stop collecting if a new tag was opened
      //       const contentToken = { value: content.trim(), type: 'CONTENT', position: contentPosition };
      //       content = '';
      //       contentPosition = 0;
      //       isCollectingContent = false;
      //       return [contentToken, token]; // return the collected content along with the opening token
      //     }
      //     content += token.value;
      //     if (!contentPosition) contentPosition = token.position;
      //     return [];
      //   }
      //   switch (token.type) {
      //     case 'TAG_CLOSE':
      //       isCollectingContent = true;
      //       break;
      //     case 'DELIMITER':
      //       return [];
      //   }
      //   return [token];
      // },
    });
    // const str =
    //   `<?xml-stylesheet href="catalog.xsl" type="text/xsl"?>
    //    <!DOCTYPE catalog SYSTEM "catalog.dtd">
    //    <catalog>
    //      <product description="Cardigan Sweater" product_image="cardigan.jpg">
    //         <size description="Large" />
    //         <color_swatch image="red_cardigan.jpg">
    //           Red cardigan
    //         </color_swatch>
    //      </product>
    //   </catalog>`;
    const str = '<foo>hey there</foo>';
    const tokens = tokenizer.tokenize(str);
    console.log(tokens);
    // expect(tokens).to.eql([
    //   { value: '<?', type: 'PROCESSING_TAG_OPEN', position: 0 },
    //   { value: 'xml-stylesheet', type: 'IDENTIFIER', position: 2 },
    //   { value: 'href', type: 'IDENTIFIER', position: 17 },
    //   { value: '=', type: 'ASSIGNMENT', position: 21 },
    //   { value: '"catalog.xsl"', type: 'DOUBLE_QUOTED_STRING', position: 22 },
    //   { value: 'type', type: 'IDENTIFIER', position: 36 },
    //   { value: '=', type: 'ASSIGNMENT', position: 40 },
    //   { value: '"text/xsl"', type: 'DOUBLE_QUOTED_STRING', position: 41 },
    //   { value: '?>', type: 'PROCESSING_TAG_CLOSE', position: 51 },
    //   { value: '<!', type: 'MARKUP_TAG_OPEN', position: 61 },
    //   { value: 'DOCTYPE', type: 'IDENTIFIER', position: 63 },
    //   { value: 'catalog', type: 'IDENTIFIER', position: 71 },
    //   { value: 'SYSTEM', type: 'IDENTIFIER', position: 79 },
    //   { value: '"catalog.dtd"', type: 'DOUBLE_QUOTED_STRING', position: 86 },
    //   { value: '>', type: 'TAG_CLOSE', position: 99 },
    //   { value: '<', type: 'START_TAG_OPEN', position: 108 },
    //   { value: 'catalog', type: 'IDENTIFIER', position: 109 },
    //   { value: '>', type: 'TAG_CLOSE', position: 116 },
    //   { value: '<', type: 'START_TAG_OPEN', position: 127 },
    //   { value: 'product', type: 'IDENTIFIER', position: 128 },
    //   { value: 'description', type: 'IDENTIFIER', position: 136 },
    //   { value: '=', type: 'ASSIGNMENT', position: 147 },
    //   { value: '"Cardigan Sweater"', type: 'DOUBLE_QUOTED_STRING', position: 148 },
    //   { value: 'product_image', type: 'IDENTIFIER', position: 167 },
    //   { value: '=', type: 'ASSIGNMENT', position: 180 },
    //   { value: '"cardigan.jpg"', type: 'DOUBLE_QUOTED_STRING', position: 181 },
    //   { value: '>', type: 'TAG_CLOSE', position: 195 },
    //   { value: '<', type: 'START_TAG_OPEN', position: 209 },
    //   { value: 'size', type: 'IDENTIFIER', position: 210 },
    //   { value: 'description', type: 'IDENTIFIER', position: 215 },
    //   { value: '=', type: 'ASSIGNMENT', position: 226 },
    //   { value: '"Large"', type: 'DOUBLE_QUOTED_STRING', position: 227 },
    //   { value: '/>', type: 'START_TAG_SELF_CLOSE', position: 235 },
    //   { value: '<', type: 'START_TAG_OPEN', position: 250 },
    //   { value: 'color_swatch', type: 'IDENTIFIER', position: 251 },
    //   { value: 'image', type: 'IDENTIFIER', position: 264 },
    //   { value: '=', type: 'ASSIGNMENT', position: 269 },
    //   { value: '"red_cardigan.jpg"', type: 'DOUBLE_QUOTED_STRING', position: 270 },
    //   { value: '>', type: 'TAG_CLOSE', position: 288 },
    //   { value: 'Red cardigan', type: 'CONTENT', position: 289 },
    //   { value: '</', type: 'END_TAG_OPEN', position: 329 },
    //   { value: 'color_swatch', type: 'IDENTIFIER', position: 331 },
    //   { value: '>', type: 'TAG_CLOSE', position: 343 },
    //   { value: '</', type: 'END_TAG_OPEN', position: 354 },
    //   { value: 'product', type: 'IDENTIFIER', position: 356 },
    //   { value: '>', type: 'TAG_CLOSE', position: 363 },
    //   { value: '</', type: 'END_TAG_OPEN', position: 371 },
    //   { value: 'catalog', type: 'IDENTIFIER', position: 373 },
    //   { value: '>', type: 'TAG_CLOSE', position: 380 },
    // ]);
  });
});

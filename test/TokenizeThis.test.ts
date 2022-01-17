// import fs from 'fs';
// import path from 'path';
// import TokenizeThis from '../src/TokenizeThis';
//
// const doubleQuotedStringNewline = fs.readFileSync(path.join(__dirname, 'fixtures/double-quoted-string-newline.txt'));
//
// describe('TokenizeThis', () => {
//   context('#tokenizeString', () => {
//     const tokenizeThis = new TokenizeThis();
//     it('turns a string into tokens', () => {
//       // const str = 'This has an "unclose quote';
//       const str = 'Tokenize! 1111 5 1s && || & | ||| "str" \n this! "esc\\"" and <= = (>= =)true false true{!=} 5!=1 !!! -5 -6 - 1 "string (with ) some {enclosure()}" {"inside" } var1: :var2 var3';
//       tokenizeThis.tokenize(str, console.log);
//       console.log('length:', str.length);
//     });
//   });
//   it('does strings', () => {
//     const tokenizeThis = new TokenizeThis();
//     console.log({ foo: doubleQuotedStringNewline.toString('utf8') });
//     // tokenizeThis.tokenize('"a string with \\n a newline"', console.log);
//     tokenizeThis.tokenize(doubleQuotedStringNewline, console.log);
//   });
// });

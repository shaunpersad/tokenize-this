import TokenizeThis from '../src/TokenizeThis';

describe('TokenizeThis', () => {
  context('#tokenizeString', () => {
    const tokenizeThis = TokenizeThis.fromDefaultConfig();
    it('turns a string into tokens', () => {
      const str = 'Tokenize! 1111 5 1s && || & | "str" \n this! "esc\\"" and <= = (>= =)true false true{!=} 5!=1 !!! -5 -6 - 1 "string (with ) some {enclosure()}" {"inside" } var1: :var2 var3';
      tokenizeThis.tokenize(str, console.log);
    });
  });
});

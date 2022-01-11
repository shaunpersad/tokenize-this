import TokenizeThis from '../src/TokenizeThis';

describe('TokenizeThis', () => {
  context('#tokenizeString', () => {
    const tokenizeThis = TokenizeThis.fromDefaultConfig();
    it('turns a string into tokens', () => {
      const str = 'Tokenize! 1111 5 1s "str" \n this! and <= = (>= =) {!=} 5!=1 !!! -5 -6 "string (with ) some {enclosure()}" {"inside" }';
      tokenizeThis.tokenizeString(str, console.log);
    });
  });
});

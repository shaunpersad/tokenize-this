import TokenizeThis from '../src/TokenizeThis';

describe('TokenizeThis', () => {
  context('#tokenizeString', () => {
    const tokenizeThis = TokenizeThis.fromDefaultConfig();
    it('turns a string into tokens', () => {
      const str = 'Tokenize! "str" \n this!';
      tokenizeThis.tokenizeString(str, console.log);
    });
  });
});

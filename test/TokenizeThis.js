"use strict";

if (!TokenizeThis) {
    var TokenizeThis = require('../TokenizeThis');
}

function equals(obj1, obj2) {

    if (JSON.stringify(obj1) !== JSON.stringify(obj2)) {
        throw new Error('The two objects are not the same.');
    }
}

describe('TokenizeThis', function() {

    describe('What is it?', function() {

        it('It turns a string into tokens!', function() {

            var tokenizer = new TokenizeThis();
            var str = 'Tokenize this!';

            var tokens = [];

            tokenizer.tokenize(str, function(token) {
                tokens.push(token);
            });

            equals(tokens, ['Tokenize', 'this', '!']);
            
        });

        it('By default, it can tokenize math-based strings', function() {

            var tokenizer = new TokenizeThis();
            var str = '5 + 6 -(4/2) + gcd(10, 5)';

            var tokens = [];

            tokenizer.tokenize(str, function(token) {

                tokens.push(token);
            });
            
            equals(tokens, [5, '+', 6, '-', '(', 4, '/', 2, ')', '+', 'gcd', '(', 10, ',', 5, ')']);
        });

        it('...Or SQL', function() {

            var tokenizer = new TokenizeThis();
            var str = 'SELECT COUNT(id), 5+6 FROM `users` WHERE name = "shaun persad" AND hobby IS NULL';

            var tokens = [];

            tokenizer.tokenize(str, function(token, surroundedBy) {
                
                if (surroundedBy) {

                    tokens.push(surroundedBy+token+surroundedBy);
                } else {
                    tokens.push(token);
                }
            });

            equals(tokens, [
                'SELECT',
                'COUNT', '(', 'id', ')',
                ',',
                5, '+', 6,
                'FROM', '`users`',
                'WHERE',
                'name', '=', '"shaun persad"',
                'AND',
                'hobby', 'IS', null
            ]);
        });

    });

    describe('Installation', function() {

        it('`npm install tokenize-this`', function() {
            // or if in the browser: <script src="tokenize-this/tokenize-this.min.js"></script>
        });
    });

    describe('Usage', function() {

        it('`require` it, create a new instance, then call `tokenize`', function() {

            // var TokenizeThis = require('tokenize-this');
            var tokenizer = new TokenizeThis();
            
            var str = 'Hi!, I want to add 5+6';

            var tokens = [];

            tokenizer.tokenize(str, function(token) {
                tokens.push(token);
            });

            equals(tokens, ['Hi', '!', ',', 'I', 'want', 'to', 'add', 5, '+', 6]);
        });
    });

    describe('Advanced Usage', function() {

        describe('Supplying a config object to the constructor', function() {

            describe('See ".defaultConfig" in the #API section for all options', function() {

                it('This can be used to tokenize many forms of data, like JSON into key-value pairs', function() {

                    var jsonConfig = {
                        shouldTokenize: ['{', '}', '[', ']'],
                        shouldMatch: ['"'],
                        shouldDelimitBy: [' ', "\n", "\r", "\t", ':', ','],
                        convertLiterals: true
                    };

                    var tokenizer = new TokenizeThis(jsonConfig);

                    var str = '[{name:"Shaun Persad", id: 5}, { gender : null}]';

                    var tokens = [];

                    tokenizer.tokenize(str, function(token) {
                        tokens.push(token);
                    });

                    equals(tokens, ['[', '{', 'name', 'Shaun Persad', 'id', 5, '}', '{', 'gender', null, '}', ']']);
                });

                it('Here it is tokenizing XML like a boss', function() {

                    var xmlConfig = {
                        shouldTokenize: ['<?', '?>', '<!', '<', '</', '>', '='],
                        shouldMatch: ['"'],
                        shouldDelimitBy: [' ', "\n", "\r", "\t"],
                        convertLiterals: true
                    };

                    var tokenizer = new TokenizeThis(xmlConfig);

                    var str = `
                    <?xml-stylesheet href="catalog.xsl" type="text/xsl"?>
                    <!DOCTYPE catalog SYSTEM "catalog.dtd">
                    <catalog>
                       <product description="Cardigan Sweater" product_image="cardigan.jpg">
                          <size description="Large" />
                          <color_swatch image="red_cardigan.jpg">
                            Red
                          </color_swatch>
                       </product>
                    </catalog>                
                `;

                    var tokens = [];

                    tokenizer.tokenize(str, function(token) {
                        tokens.push(token);
                    });

                    equals(tokens,
                        [
                            '<?', 'xml-stylesheet', 'href', '=', 'catalog.xsl', 'type', '=', 'text/xsl', '?>',
                            '<!', 'DOCTYPE', 'catalog', 'SYSTEM', 'catalog.dtd', '>',
                            '<', 'catalog', '>',
                            '<', 'product', 'description', '=', 'Cardigan Sweater', 'product_image', '=', 'cardigan.jpg', '>',
                            '<', 'size', 'description', '=', 'Large', '/', '>',
                            '<', 'color_swatch', 'image', '=', 'red_cardigan.jpg', '>',
                            'Red',
                            '</', 'color_swatch', '>',
                            '</', 'product', '>',
                            '</', 'catalog', '>'
                        ]
                    );
                });

                it('The above examples are the first steps in writing parsers for those formats. The next would be parsing the stream of tokens based on the format-specific rules, e.g. [SQL](https://github.com/shaunpersad/sql-where-parser)', function() {

                });
            });
        });
    });

    describe('API', function() {

        describe('Methods', function() {

            describe('#tokenize(str:String, forEachToken:Function)', function() {

                it('sends each token to the `forEachToken(token:String, surroundedBy:String)` callback', function() {

                    var tokenizer = new TokenizeThis();
                    var str = 'Tokenize "this"!';

                    var tokens = [];
                    var forEachToken = function(token, surroundedBy) {

                        tokens.push(surroundedBy+token+surroundedBy);
                    };

                    tokenizer.tokenize(str, forEachToken);

                    equals(tokens, ['Tokenize', '"this"', '!']);
                });

                it('it converts `true`, `false`, `null`, and numbers into their literal versions', function() {

                    var tokenizer = new TokenizeThis();
                    var str = 'true false null TRUE FALSE NULL 1 2 3.4 5.6789';

                    var tokens = [];

                    tokenizer.tokenize(str, function(token, surroundedBy) {

                        tokens.push(token);
                    });

                    equals(tokens, [true, false, null, true, false, null, 1, 2, 3.4, 5.6789]);
                });
            });

            describe('.defaultConfig:Object', function() {

                it('The default config object used when no config is supplied', function() {

                    var config = {
                        shouldTokenize: ['(', ')', ',', '*', '/', '%', '+', '-', '=', '!=', '!', '<', '>', '<=', '>=', '^'],
                        shouldMatch: ['"', "'", '`'],
                        shouldDelimitBy: [' ', "\n", "\r", "\t"],
                        convertLiterals: true,
                        escapeCharacter: "\\"
                    };

                    equals(TokenizeThis.defaultConfig, config);
                });

                it('You can change converting to literals with the `convertLiterals` config option', function() {

                    var config = {
                        convertLiterals: false
                    };
                    var tokenizer = new TokenizeThis(config);
                    var str = 'true false null TRUE FALSE NULL 1 2 3.4 5.6789';

                    var tokens = [];

                    tokenizer.tokenize(str, function(token, surroundedBy) {

                        tokens.push(token);
                    });

                    equals(tokens, ['true', 'false', 'null', 'TRUE', 'FALSE', 'NULL', '1', '2', '3.4', '5.6789']);
                });

                it('Any strings surrounded by the quotes specified in the `shouldMatch` option are treated as whole tokens', function() {

                    var config = {
                        shouldMatch: ['"', '`', '#']
                    };
                    var tokenizer = new TokenizeThis(config);
                    var str = '"hi there" `this is a test` #of quotes#';

                    var tokens = [];
                    var tokensQuoted = [];

                    tokenizer.tokenize(str, function(token, surroundedBy) {

                        tokens.push(token);
                        tokensQuoted.push(surroundedBy+token+surroundedBy);
                    });

                    equals(tokens, ['hi there', 'this is a test', 'of quotes']);
                    equals(tokensQuoted, ['"hi there"', '`this is a test`', '#of quotes#']);
                });

                it('Quotes can be escaped via a backslash', function() {

                    var tokenizer = new TokenizeThis();
                    var str = 'These are "\\"quotes\\""';

                    var tokens = [];

                    tokenizer.tokenize(str, function(token, surroundedBy) {

                        tokens.push(token);
                    });
                    
                    equals(tokens, ['These', 'are', '"quotes"']);
                });

                it('The escape character can be specified with the `escapeCharacter` option', function() {

                    var config = {
                        escapeCharacter: '#'
                    };
                    var tokenizer = new TokenizeThis(config);
                    var str = 'These are "#"quotes#""';

                    var tokens = [];

                    tokenizer.tokenize(str, function(token, surroundedBy) {

                        tokens.push(token);
                    });

                    equals(tokens, ['These', 'are', '"quotes"']);
                });
            });
        });
    });
});

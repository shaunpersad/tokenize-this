## TODO
[] get rid of `execute`

# TokenizeThis
Turns a string into tokens.

### How it works
This tokenizer is *not* regex-based, but instead builds a graph of characters.

The graph is traversed through each new character in the input, and emits tokens when the proper conditions are met.
This makes the tokenization process orders of magnitude faster than regex-based tokenizers.

Additionally, the tokenizer can be used to tokenize the entire input at once, or as an input stream.

## Quickstart

It turns a string into tokens.

```js
var tokenizer = new TokenizeThis();
var str = 'Tokenize this!';
var tokens = [];
tokenizer.tokenize(str, function(token) {
    tokens.push(token);
});
equals(tokens, ['Tokenize', 'this', '!']);
```

By default, it can tokenize math-based strings.

```js
var tokenizer = new TokenizeThis();
var str = '5 + 6 -(4/2) + gcd(10, 5)';
var tokens = [];
tokenizer.tokenize(str, function(token) {
    tokens.push(token);
});

equals(tokens, [5, '+', 6, '-', '(', 4, '/', 2, ')', '+', 'gcd', '(', 10, ',', 5, ')']);
```

...Or SQL.

```js
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
```


## Installation

`npm install tokenize-this`.

```js
// or if in the browser: <script src="tokenize-this/tokenize-this.min.js"></script>
```

## Usage

`require` it, create a new instance, then call `tokenize`.

```js
// var TokenizeThis = require('tokenize-this');
// OR
// var TokenizeThis = require('tokenize-this/tokenize-this.min.js'); // for node.js < 4.0
// OR
// <script src="tokenize-this/tokenize-this.min.js"></script> <!-- if in browser -->

var tokenizer = new TokenizeThis();

var str = 'Hi!, I want to add 5+6';
var tokens = [];
tokenizer.tokenize(str, function(token) {
    tokens.push(token);
});
equals(tokens, ['Hi', '!', ',', 'I', 'want', 'to', 'add', 5, '+', 6]);
```


## Advanced Usage

### Supplying a config object to the constructor

#### See [here](#defaultconfigobject) for all options

This can be used to tokenize many forms of data, like JSON into key-value pairs.

```js
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
```

Here it is tokenizing XML like a boss.

```js
var xmlConfig = {
    shouldTokenize: ['<?', '?>', '<!', '<', '</', '>', '/>', '='],
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
        '<', 'size', 'description', '=', 'Large', '/>',
        '<', 'color_swatch', 'image', '=', 'red_cardigan.jpg', '>',
        'Red',
        '</', 'color_swatch', '>',
        '</', 'product', '>',
        '</', 'catalog', '>'
    ]
);
```

The above examples are the first steps in writing parsers for those formats. The next would be parsing the stream of tokens based on the format-specific rules, e.g. [SQL](https://github.com/shaunpersad/sql-where-parser).


## API

### Methods

#### #tokenize(str:String, forEachToken:Function)

sends each token to the `forEachToken(token:String, surroundedBy:String, index:Integer)` callback.

```js
var tokenizer = new TokenizeThis();
var str = 'Tokenize "this"!';

var tokens = [];
var indices = [];
var forEachToken = function(token, surroundedBy, index) {

    tokens.push(surroundedBy+token+surroundedBy);
    indices.push(index);
};

tokenizer.tokenize(str, forEachToken);

equals(tokens, ['Tokenize', '"this"', '!']);
equals(indices, [8, 14, 15]);
```

it converts `true`, `false`, `null`, and numbers into their literal versions.

```js
var tokenizer = new TokenizeThis();
var str = 'true false null TRUE FALSE NULL 1 2 3.4 5.6789';
var tokens = [];
tokenizer.tokenize(str, function(token, surroundedBy) {
    tokens.push(token);
});
equals(tokens, [true, false, null, true, false, null, 1, 2, 3.4, 5.6789]);
```

#### .defaultConfig:Object

The default config object used when no config is supplied.

```js
var config = {
    shouldTokenize: ['(', ')', ',', '*', '/', '%', '+', '-', '=', '!=', '!', '<', '>', '<=', '>=', '^'],
    shouldMatch: ['"', "'", '`'],
    shouldDelimitBy: [' ', "\n", "\r", "\t"],
    convertLiterals: true,
    escapeCharacter: "\\"
};
equals(TokenizeThis.defaultConfig, config);
```

You can change converting to literals with the `convertLiterals` config option.

```js
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
```

Any strings surrounded by the quotes specified in the `shouldMatch` option are treated as whole tokens.

```js
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
```

Quotes can be escaped via a backslash.

```js
var tokenizer = new TokenizeThis();
var str = 'These are "\\"quotes\\""';
var tokens = [];
tokenizer.tokenize(str, function(token, surroundedBy) {
    tokens.push(token);
});

equals(tokens, ['These', 'are', '"quotes"']);
```

The escape character can be specified with the `escapeCharacter` option.

```js
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
```

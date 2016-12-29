# TokenizeThis

## What is it?
It turns a string into tokens!.

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
var tokenizer = new TokenizeThis();

var str = 'Hi!, I want to add 5+6';
var tokens = [];
tokenizer.tokenize(str, function(token) {
    tokens.push(token);
});
equals(tokens, ['Hi', '!', ',', 'I', 'want', 'to', 'add', 5, '+', 6]);
```

## Advanced Usage

### Supplying a config object to the constructor is also possible (see [here](#defaultconfigobject) for all options)

This can be used to parse other forms of data, like JSON into key-value pairs.

```js
var jsonConfig = {
    shouldTokenize: ['{', '}', '[', ']'],
    shouldMatch: ['"'],
    shouldDelimitBy: [' ', "\n", "\r", "\t", ':', ',']
};
var tokenizer = new TokenizeThis(jsonConfig);
var str = '[{name:"Shaun Persad", id: 5}, { gender : null}]';
var tokens = [];
tokenizer.tokenize(str, function(token) {
    tokens.push(token);
});
equals(tokens, ['[', '{', 'name', 'Shaun Persad', 'id', 5, '}', '{', 'gender', null, '}', ']']);
```

## API

### #tokenize(str:String, forEachToken(token:*, surroundedBy:String):Function) 

sends each token to the `forEachToken` callback.

```js
var tokenizer = new TokenizeThis();
var str = 'Tokenize "this"!';
var tokens = [];
var forEachToken = function(token, surroundedBy) {
    tokens.push(surroundedBy+token+surroundedBy);
};
tokenizer.tokenize(str, forEachToken);
equals(tokens, ['Tokenize', '"this"', '!']);
```

converts `true`, `false`, `null`, and numbers into their literal versions.

```js
var tokenizer = new TokenizeThis();
var str = 'true false null TRUE FALSE NULL 1 2 3.4 5.6789';
var tokens = [];
tokenizer.tokenize(str, function(token, surroundedBy) {
    tokens.push(token);
});
equals(tokens, [true, false, null, true, false, null, 1, 2, 3.4, 5.6789]);
```

### .defaultConfig:Object

The default config object used when no config is supplied.

```js
var config = {
    shouldTokenize: ['(', ')', ',', '*', '/', '%', '+', '-', '=', '!=', '!', '<', '>', '<=', '>=', '^'],
    shouldMatch: ['"', "'", '`'],
    shouldDelimitBy: [' ', "\n", "\r", "\t"]
};

equals(TokenizeThis.defaultConfig, config);
```
import { TokenizerConfig, TokenizerGreedyMatcherQuery } from '../RegexTokenizer';

export const unescaped = ({ source }: RegExp): RegExp => new RegExp(`(?<!\\\\)(?:\\\\\\\\)*${source}`);
export const singleLineContent = ({ source }: RegExp): RegExp => new RegExp(`${source}.*?`);
export const multiLineContent = ({ source }: RegExp): RegExp => new RegExp(`${source}(?:.|\n)*?`);

export const ALL_WHITESPACE = /\s+/;
export const NULL = /\bnull\b/;
export const DOUBLE_SLASH = /\/\//;
export const SLASH_STAR = /\/\*/;
export const STAR_SLASH = /\*\//;
export const NUMBER = /-?(?:\d*\.)?\d+\b/;
export const BOOLEAN = /\btrue|false\b/;
export const SEPARATOR = /[,(){}\/\\:]/;
export const OPERATOR = /\*|\?|%|\+|-|!=|=|!|<=|>=|<|>|\^|&{1,2}|\|{1,2}/;
export const IDENTIFIER = /\b[a-zA-Z_][a-zA-Z_0-9]*/;
export const COMMA = /,/;
export const NEWLINE = /\n/;
export const DOUBLE_QUOTE = /"/;
export const DOUBLE_QUOTE_SINGLE_LINE_CONTENT = singleLineContent(DOUBLE_QUOTE);
export const DOUBLE_QUOTE_MULTI_LINE_CONTENT = multiLineContent(DOUBLE_QUOTE);
export const UNESCAPED_DOUBLE_QUOTE = unescaped(DOUBLE_QUOTE);
export const SINGLE_QUOTE = /'/;
export const SINGLE_QUOTE_SINGLE_LINE_CONTENT = singleLineContent(SINGLE_QUOTE);
export const SINGLE_QUOTE_MULTI_LINE_CONTENT = multiLineContent(SINGLE_QUOTE);
export const UNESCAPED_SINGLE_QUOTE = unescaped(SINGLE_QUOTE);
export const BACKTICK = /`/;
export const BACKTICK_SINGLE_LINE_CONTENT = singleLineContent(BACKTICK);
export const BACKTICK_MULTI_LINE_CONTENT = multiLineContent(BACKTICK);
export const UNESCAPED_BACKTICK = unescaped(BACKTICK);

export const DOUBLE_QUOTED_STRING_SINGLE_LINE: TokenizerGreedyMatcherQuery = {
  openedBy: DOUBLE_QUOTE_SINGLE_LINE_CONTENT,
  closedBy: UNESCAPED_DOUBLE_QUOTE,
};
export const SINGLE_QUOTED_STRING_SINGLE_LINE: TokenizerGreedyMatcherQuery = {
  openedBy: SINGLE_QUOTE_SINGLE_LINE_CONTENT,
  closedBy: UNESCAPED_SINGLE_QUOTE,
};
export const BACKTICK_STRING_MULTI_LINE: TokenizerGreedyMatcherQuery = {
  openedBy: BACKTICK_MULTI_LINE_CONTENT,
  closedBy: UNESCAPED_BACKTICK,
};
export const SINGLE_LINE_COMMENT: TokenizerGreedyMatcherQuery = {
  openedBy: DOUBLE_SLASH,
  closedBy: NEWLINE,
};
export const MULTI_LINE_COMMENT: TokenizerGreedyMatcherQuery = {
  openedBy: SLASH_STAR,
  closedBy: STAR_SLASH,
};

export const config: TokenizerConfig = {
  matchers: [
    {
      type: 'NUMBER',
      query: NUMBER,
    },
    {
      type: 'BOOLEAN',
      query: BOOLEAN,
    },
    {
      type: 'NULL',
      query: NULL,
    },
    {
      type: 'SEPARATOR',
      query: SEPARATOR,
    },
    {
      type: 'OPERATOR',
      query: OPERATOR,
    },
    {
      type: 'IDENTIFIER',
      query: IDENTIFIER,
    },
    {
      type: 'NEWLINE',
      query: NEWLINE,
    },
  ],
  greedyMatchers: [
    {
      type: 'DOUBLE_QUOTED_STRING',
      query: DOUBLE_QUOTED_STRING_SINGLE_LINE,
    },
    {
      type: 'SINGLE_QUOTED_STRING',
      query: SINGLE_QUOTED_STRING_SINGLE_LINE,
    },
    {
      type: 'BACKTICK_STRING',
      query: BACKTICK_STRING_MULTI_LINE,
    },
    {
      type: 'SINGLE_LINE_COMMENT',
      query: SINGLE_LINE_COMMENT,
    },
    {
      type: 'MULTI_LINE_COMMENT',
      query: MULTI_LINE_COMMENT,
    },
  ],
  delimiters: ALL_WHITESPACE,
};

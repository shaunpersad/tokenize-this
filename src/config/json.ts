import { TokenizerConfig } from '../Tokenizer';
import { NUMBER, BOOLEAN, NULL, DOUBLE_QUOTED_STRING_SINGLE_LINE, ALL_WHITESPACE, COMMA } from './common';
export { NUMBER, BOOLEAN, NULL, DOUBLE_QUOTED_STRING_SINGLE_LINE, ALL_WHITESPACE, COMMA };
export const ARRAY_OPENED = /\[/;
export const ARRAY_CLOSED = /]/;
export const OBJECT_OPENED = /{/;
export const OBJECT_CLOSED = /}/;
export const OBJECT_ASSIGNMENT = /:/;

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
      type: 'ARRAY_OPENED',
      query: ARRAY_OPENED,
    },
    {
      type: 'ARRAY_CLOSED',
      query: ARRAY_CLOSED,
    },
    {
      type: 'OBJECT_OPENED',
      query: OBJECT_OPENED,
    },
    {
      type: 'OBJECT_CLOSED',
      query: OBJECT_CLOSED,
    },
    {
      type: 'OBJECT_ASSIGNMENT',
      query: OBJECT_ASSIGNMENT,
    },
    {
      type: 'COMMA',
      query: COMMA,
    },
  ],
  greedyMatchers: [
    {
      type: 'DOUBLE_QUOTED_STRING',
      query: DOUBLE_QUOTED_STRING_SINGLE_LINE,
    },
  ],
  delimiters: ALL_WHITESPACE,
};

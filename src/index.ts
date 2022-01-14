import TokenizeThis from './TokenizeThis';
import Tokenizer, { TokenizerConfig, TokenizerEmitter, TokenizerToken } from './Tokenizer';
import { config as commonConfig } from './config/common';
import { config as jsonConfig } from './config/json';

export type {
  TokenizerConfig,
  TokenizerEmitter,
  TokenizerToken,
};

export {
  TokenizeThis,
  Tokenizer,
  commonConfig,
  jsonConfig,
};

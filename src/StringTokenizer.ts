import Tokenizer, { TokenizerChunk } from './Tokenizer';
import CharNode from './CharNode';

export type StringTokenizerMatcher = {
  type: string,
  startsWith: string,
  endsWith?: string,
  haltsWith?: string,
  escapeHaltsWith?: string,
};

export type StringTokenizerConfig = {
  keywords?: string[],
  punctuation?: string[],
  delimiters?: string[],
  matchers?: StringTokenizerMatcher[],
  keywordType?: string | 'KEYWORD',
  punctuationType?: string | 'PUNCTUATION',
  delimiterType?: string | 'DELIMITER',
  identifierType?: string | 'IDENTIFIER',
  numberType?: string | 'NUMBER',
  numberFloatType?: string | 'NUMBER',
  floatsHaveLeadingNumber?: boolean,
  haltedTypePrefix?: string | 'HALTED_',
  unknownType?: string | 'UNKNOWN',
};

export const charIsLetter = (char: string) => (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
export const charIsNumber = (char: string) => (char >= '0' && char <= '9');
export const isStartOfIdentifier = (char: string) => char === '_' || charIsLetter(char);
export const isInIdentifier = (char: string) => char === '_' || charIsLetter(char) || charIsNumber(char);

export default class StringTokenizer extends Tokenizer {

  protected buffer = '';

  protected rootNode = new CharNode();

  protected stateNode = this.rootNode;

  constructor({ keywords = [], punctuation = [], delimiters = [], matchers = [], ...optional }: StringTokenizerConfig) {
    super();
    const keywordType = optional.delimiterType || 'KEYWORD';
    const punctuationType = optional.delimiterType || 'PUNCTUATION';
    const delimiterType = optional.delimiterType || 'DELIMITER';
    const identifierType = optional.delimiterType || 'IDENTIFIER';
    const numberType = optional.numberType || 'NUMBER';
    const numberFloatType = numberType || 'FLOAT';
    const floatsHaveLeadingNumber = optional.floatsHaveLeadingNumber || false;
    const haltedTypePrefix = optional.haltedTypePrefix || 'HALTED_';
    const unknownType = optional.unknownType || 'UNKNOWN';
    const delimitersWithEOF = delimiters.concat('');

    const sendPrevious = (previousNode: CharNode, previousType: string, currentType: string, currentValue: string) => {
      const endNode = previousNode.addDescendant(currentValue);
      endNode.execute = (str, startIndex, currentIndex) => {
        const previousValue = str.substring(startIndex, (currentIndex + 1) - currentValue.length);
        // console.log({ currentIndex, startIndex: this.position, previousValue, previousType, currentValue, currentType });
        this.send(previousValue, previousType);
        this.stateNode = this.rootNode;
        for (let x = 0; x < currentValue.length; x++) {
          this.stateNode = this.stateNode.getChild(currentValue.charAt(x));
        }
        // console.log({ str, startIndex, currentIndex });
        this.stateNode.execute(str, startIndex, currentIndex);
      };
    };
    const waitToTokenize = (node: CharNode, type: string) => {
      delimitersWithEOF.forEach((delimiterValue) => sendPrevious(node, type, delimiterType, delimiterValue));
      punctuation?.forEach((punctuationValue) => sendPrevious(node, type, punctuationType, punctuationValue));
    };

    const unknownNode = new CharNode('--unknown--');
    waitToTokenize(unknownNode, unknownType);

    const identifierNode = new CharNode('--identifier--');
    identifierNode.getDefaultChild = (char) => isInIdentifier(char) ? identifierNode : unknownNode;
    waitToTokenize(identifierNode, identifierType);

    const numberNode = new CharNode('--number--');
    numberNode.getDefaultChild = (char) => charIsNumber(char) ? numberNode : unknownNode;
    waitToTokenize(numberNode, numberType);

    const numberFloatNode = numberNode.addChild('.');
    numberFloatNode.getDefaultChild = (char) => charIsNumber(char) ? numberFloatNode : unknownNode;
    waitToTokenize(numberFloatNode, numberFloatType);

    keywords.forEach((keyword) => {
      let node = this.rootNode;
      [...keyword].forEach((char: string) => {
        node = node.addChild(char);
        waitToTokenize(node, identifierType);
      });
      node.getDefaultChild = identifierNode.getDefaultChild;
      waitToTokenize(node, keywordType);
    });

    matchers?.forEach(
      ({ type, startsWith, endsWith = '', haltsWith = '', escapeHaltsWith = '' }) => {
        const haltedType = `${haltedTypePrefix}${type}`;
        const node = this.rootNode.addDescendant(startsWith);
        if (!endsWith) {
          waitToTokenize(node, type);
          return;
        }
        const endNode = node.addDescendant(endsWith);
        endNode.execute = (str, startIndex, currentIndex) => {
          let escapeIndex = currentIndex - endsWith.length;
          let numInstances = 0;
          while (escapeIndex >= 0) {
            if (str.charAt(escapeIndex) != escapeHaltsWith) {
              break;
            }
            numInstances++;
            escapeIndex--;
          }
          const escaped = numInstances % 2;
          if (!numInstances || !escaped) {
            const value = str.substring(startIndex, currentIndex + 1);
            this.send(value, type);
          }
        };
        const eofNode = node.addDescendant('');
        eofNode.execute = (str, startIndex, currentIndex) => {
          const value = str.substring(startIndex, currentIndex + 1);
          this.send(value, haltedType);
        };
        if (haltsWith) {
          const haltNode = node.addDescendant(haltsWith);
          haltNode.execute = (str, startIndex, currentIndex) => {
            const value = str.substring(startIndex, currentIndex + 1);
            this.send(value, haltedType);
          };
          if (escapeHaltsWith) {
            if (escapeHaltsWith.length > 1) {
              throw new Error('Escaping with more than a single character is not currently supported.');
            }
            haltNode.execute = (str, startIndex, currentIndex) => {
              let escapeIndex = currentIndex - haltsWith.length;
              let numInstances = 0;
              while (escapeIndex >= 0) {
                if (str.charAt(escapeIndex) != escapeHaltsWith) {
                  break;
                }
                numInstances++;
                escapeIndex--;
              }
              const escaped = numInstances % 2;
              if (!numInstances || !escaped) {
                const value = str.substring(startIndex, currentIndex + 1);
                this.send(value, haltedType);
              }
            };
          }
        }
      },
    );
    delimiters?.forEach((delimiterValue) => {
      const node = this.rootNode.addDescendant(delimiterValue);
      node.execute = () => this.send(delimiterValue, delimiterType);
    });
    punctuation?.forEach((punctuationValue) => {
      const node = this.rootNode.addDescendant(punctuationValue);
      node.getDefaultChild = (char) => {
        // console.log('sending from root punctuation');
        this.send(punctuationValue, punctuationType);
        return this.rootNode.getChild(char);
      };
    });
    if (!floatsHaveLeadingNumber) {
      this.rootNode.children.set('.', numberFloatNode);
    }
    this.rootNode.getDefaultChild = (char: string) => {
      if (isStartOfIdentifier(char)) {
        return identifierNode;
      }
      if (charIsNumber(char)) {
        return numberNode;
      }
      return unknownNode;
    };
  }

  transform(chunk: TokenizerChunk) {
    const str = `${this.buffer}${chunk.toString()}`;
    const length = str.length;
    const startPosition = this.position;
    for (let currentIndex = this.buffer.length; currentIndex < length; currentIndex++) {
      const char = str.charAt(currentIndex);
      // console.log({ char, stateBefore: this.stateNode.char });
      this.stateNode = this.stateNode.getChild(char);
      // console.log({ stateAfter: this.stateNode.char });
      // console.log('transform', { char: this.stateNode.char, buffer: this.buffer, currentIndex, startPosition });
      this.stateNode.execute(str, this.position - startPosition, currentIndex);
    }
    // console.log('buffer before', this.buffer);
    this.buffer = str.substring(this.position - startPosition);
    // console.log('buffer after', this.buffer, this.position, startPosition, this.position - startPosition);
  }

  flush() {
    // console.log('flush');
    this.stateNode = this.stateNode.getChild('');
    // console.log('after', this.stateNode.char);
    this.stateNode.execute(this.buffer, 0, this.buffer.length);
  }

  protected send(value: string, type?: string): void {
    // console.log('sending', value, type);
    const { position } = this;
    if (value) this.forEachToken({ value, position, type });
    this.position += value.length;
    this.stateNode = this.rootNode;
  }
}


export type CharNodeExecute = (str: string, startIndex: number, currentIndex: number) => void;
export type CharNodeGetDefaultChild = (char: string, parent: CharNode) => CharNode;

export default class CharNode {
  readonly char: string = '';

  readonly children: Map<string, CharNode> = new Map<string, CharNode>();

  execute: CharNodeExecute = () => 0;

  getDefaultChild: CharNodeGetDefaultChild = () => this;

  constructor(char = '') {
    this.char = char;
  }

  addChild(char: string): CharNode {
    const { children } = this;
    if (!children.has(char)) {
      children.set(char, new CharNode(char));
    }
    return children.get(char) as CharNode;
  }

  getChild(char: string): CharNode {
    return this.children.get(char) || this.getDefaultChild(char, this);
  }

  addDescendant(str: string): CharNode {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: CharNode = this;
    if (!str.length) {
      return node.addChild(str);
    }
    for (let x = 0; x < str.length; x++) {
      const char = str.charAt(x);
      node = node.addChild(char);
    }
    return node;
  }

  toJSON(): any {
    return {
      char: this.char,
      children: Array.from(this.children.entries()).reduce((obj, [key, value]) => {
        return { ...obj, [key]: value.toJSON() };
      }, {} as Record<string, CharNode>),
    };
  }

  toString(): string {
    return JSON.stringify(this, null, 2);
  }
}

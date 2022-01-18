export type CharNodeExecute = (str: string, startIndex: number, currentIndex: number) => void;
export type CharNodeGetDefaultChild = (char: string, parent: CharNode) => CharNode;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CharNodeJSON extends Record<string, CharNodeJSON> {}

export default class CharNode {

  readonly children: Map<string, CharNode> = new Map<string, CharNode>();

  execute: CharNodeExecute = () => 0;

  getDefaultChild: CharNodeGetDefaultChild = () => this;

  addChild(char: string): CharNode {
    const { children } = this;
    if (!children.has(char)) {
      children.set(char, new CharNode());
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

  getDescendant(str: string): CharNode {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: CharNode = this;
    for (let x = 0; x < str.length; x++) {
      node = node.getChild(str.charAt(x));
    }
    return node;
  }

  toJSON(): CharNodeJSON {
    return Array.from(this.children.entries()).reduce((obj, [key, value]) => {
      return { ...obj, [key]: value.toJSON() };
    }, {} as CharNodeJSON);
  }

  toString(): string {
    return JSON.stringify(this, null, 2);
  }
}

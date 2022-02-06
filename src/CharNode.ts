export type CharNodeExecute = (str: string, startIndex: number, currentIndex: number) => void;
export type CharNodeGetDefaultChild = (char: string) => CharNode;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CharNodeJSON extends Record<string, CharNodeJSON> {}

export default class CharNode {
  /**
   * The next possible characters that lead to a valid token.
   */
  readonly children: Map<string, CharNode> = new Map<string, CharNode>();

  /**
   * What to do when we encounter this node.
   * By default, do nothing.
   */
  execute: CharNodeExecute = () => {};

  /**
   * What node to send back if we don't have a child for this char.
   * By default, send back the same node.
   */
  getDefaultChild: CharNodeGetDefaultChild = () => this;

  addChild(char: string): CharNode {
    const { children } = this;
    if (!children.has(char)) {
      children.set(char, new CharNode());
    }
    return children.get(char) as CharNode;
  }

  getChild(char: string): CharNode {
    return this.children.get(char) || this.getDefaultChild(char);
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

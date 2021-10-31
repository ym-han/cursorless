import { TextDocumentChangeEvent, Range, TextDocument } from "vscode";
import { HatStyleName } from "./constants";
import { Graph, SelectionWithEditor, Token } from "../typings/Types";
import { getDefault } from "../util/map";

/**
 * Maps from (hatStyle, character) pairs to tokens
 */
export default class NavigationMap {
  private documentTokenLists: Map<string, Token[]> = new Map();
  private deregisterFunctions: (() => void)[] = [];

  private map: {
    [decoratedCharacter: string]: Token;
  } = {};

  constructor(private graph: Graph) {}

  private getDocumentTokenList(document: TextDocument) {
    const key = document.uri.toString();
    let currentValue = this.documentTokenLists.get(key);

    if (currentValue == null) {
      currentValue = [];
      this.documentTokenLists.set(key, currentValue);
      this.deregisterFunctions.push(
        this.graph.selectionUpdater.registerRangeInfos(document, currentValue)
      );
    }

    return currentValue;
  }

  static getKey(hatStyle: HatStyleName, character: string) {
    return `${hatStyle}.${character}`;
  }

  static splitKey(key: string) {
    const [hatStyle, character] = key.split(".");
    return { hatStyle: hatStyle as HatStyleName, character };
  }

  public addToken(hatStyle: HatStyleName, character: string, token: Token) {
    this.map[NavigationMap.getKey(hatStyle, character)] = token;
    this.getDocumentTokenList(token.editor.document).push(token);
  }

  public getToken(hatStyle: HatStyleName, character: string) {
    return this.map[NavigationMap.getKey(hatStyle, character)];
  }

  public clear() {
    this.map = {};
    this.documentTokenLists.forEach((tokenList) => (tokenList.length = 0));
  }

  public dispose() {
    this.deregisterFunctions.forEach((func) => func());
  }
}
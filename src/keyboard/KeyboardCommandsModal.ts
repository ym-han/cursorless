import { keys, merge, toPairs } from "lodash";
import * as vscode from "vscode";
import { Graph } from "../typings/Types";
import {
  actionKeymap,
  colorKeymap,
  Keymap,
  scopeKeymap,
  shapeKeymap,
} from "./Keymaps";

type SectionName = "actions" | "scopes" | "colors" | "shapes";

interface KeyHandler<T> {
  sectionName: SectionName;
  value: T;
  handleValue(): void;
}

/**
 * Defines a mode to use with a modal version of Cursorless keyboard.
 */
export default class KeyboardCommandsModal {
  private isModeOn = false;
  private inputDisposable: vscode.Disposable | undefined;
  private mergedKeymap!: Record<string, KeyHandler<any>>;

  constructor(private graph: Graph) {
    this.modeOn = this.modeOn.bind(this);
    this.modeOff = this.modeOff.bind(this);
    this.handleInput = this.handleInput.bind(this);

    this.constructMergedKeymap();
  }

  init() {
    this.graph.extensionContext.subscriptions.push(
      vscode.commands.registerCommand(
        "cursorless.keyboard.modal.modeOn",
        this.modeOn
      ),
      vscode.commands.registerCommand(
        "cursorless.keyboard.modal.modeOff",
        this.modeOff
      ),
      vscode.commands.registerCommand(
        "cursorless.keyboard.modal.modeToggle",
        this.modeToggle
      ),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (
          event.affectsConfiguration("cursorless.keyboard.modal.keybindings")
        ) {
          this.constructMergedKeymap();
        }
      })
    );
  }

  private constructMergedKeymap() {
    this.mergedKeymap = {};

    this.handleSection("actions", actionKeymap, (value) => {
      return this.graph.keyboardCommands.targeted.performActionOnTarget(value);
    });
    this.handleSection("scopes", scopeKeymap, (value) => {
      return this.graph.keyboardCommands.targeted.targetScopeType({
        scopeType: value,
      });
    });
    this.handleSection("colors", colorKeymap, (value) => {
      return this.graph.keyboardCommands.targeted.targetDecoratedMark({
        color: value,
      });
    });
    this.handleSection("shapes", shapeKeymap, (value) => {
      return this.graph.keyboardCommands.targeted.targetDecoratedMark({
        shape: value,
      });
    });
  }

  private handleSection<T>(
    sectionName: SectionName,
    defaultKeyMap: Keymap<T>,
    handleValue: (value: T) => void
  ) {
    const userOverrides: Keymap<T> =
      vscode.workspace
        .getConfiguration("cursorless.keyboard.modal.keybindings")
        .get<Keymap<T>>(sectionName) ?? {};
    const keyMap = merge({}, defaultKeyMap, userOverrides);

    for (const [key, value] of toPairs(keyMap)) {
      const conflictingEntry = this.getConflictingKeyMapEntry(key);
      if (conflictingEntry != null) {
        const { sectionName: conflictingSection, value: conflictingValue } =
          conflictingEntry;

        vscode.window.showErrorMessage(
          `Conflicting keybindings: \`${sectionName}.${value}\` and \`${conflictingSection}.${conflictingValue}\` both want key '${key}'`
        );

        continue;
      }

      const entry: KeyHandler<T> = {
        sectionName,
        value,
        handleValue: () => handleValue(value),
      };

      this.mergedKeymap[key] = entry;
    }
  }

  modeOn = async () => {
    if (this.isModeOn) {
      return;
    }

    this.inputDisposable =
      this.graph.keyboardCommands.keyboardHandler.pushListener({
        handleInput: this.handleInput,
        displayOptions: {
          cursorStyle: vscode.TextEditorCursorStyle.BlockOutline,
          whenClauseContext: "cursorless.keyboard.modal.mode",
          statusBarText: "Listening...",
        },
        handleCancelled: this.modeOff,
      });

    await this.graph.keyboardCommands.targeted.targetSelection();

    // NB: Set this after pushing the listener in case binding "type" fails
    // because someone else has bound it already (eg vim extension).
    this.isModeOn = true;
  };

  modeOff = async () => {
    if (!this.isModeOn) {
      return;
    }

    this.isModeOn = false;

    this.inputDisposable?.dispose();
    this.inputDisposable = undefined;

    await this.graph.keyboardCommands.targeted.clearTarget();
  };

  modeToggle = () => {
    if (this.isModeOn) {
      this.modeOff();
    } else {
      this.modeOn();
    }
  };

  async handleInput(text: string) {
    let sequence = text;
    let keyHandler: KeyHandler<any> | undefined = this.mergedKeymap[sequence];

    while (keyHandler == null) {
      if (!this.isPrefixOfKey(sequence)) {
        const errorMessage = `Unknown key sequence "${sequence}"`;
        vscode.window.showErrorMessage(errorMessage);
        throw Error(errorMessage);
      }

      const nextKey =
        await this.graph.keyboardCommands.keyboardHandler.awaitSingleKeypress({
          cursorStyle: vscode.TextEditorCursorStyle.Underline,
          whenClauseContext: "cursorless.keyboard.targeted.awaitingKeys",
          statusBarText: "Finish sequence...",
        });

      if (nextKey == null) {
        return;
      }

      sequence += nextKey;
      keyHandler = this.mergedKeymap[sequence];
    }

    keyHandler.handleValue();
  }

  isPrefixOfKey(text: string): boolean {
    return keys(this.mergedKeymap).some((key) => key.startsWith(text));
  }

  getConflictingKeyMapEntry(text: string): KeyHandler<any> | undefined {
    const conflictingPair = toPairs(this.mergedKeymap).find(
      ([key]) => text.startsWith(key) || key.startsWith(text)
    );

    return conflictingPair == null ? undefined : conflictingPair[1];
  }
}

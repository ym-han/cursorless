import { Graph } from "../typings/Types";
import { ActionRecord } from "./actions.types";
import {
  CommentLines,
  ExtractVariable,
  IndentLines,
  OutdentLines,
  Rename,
  RevealDefinition,
  RevealTypeDefinition,
  ShowDebugHover,
  ShowHover,
  ShowQuickFix,
  ShowReferences,
} from "./MakeshiftActions";
import { Bring, Move, Swap } from "./BringMoveSwap";
import Call from "./Call";
import Clear from "./Clear";
import { Copy, Cut } from "./CutCopy";
import Deselect from "./Deselect";
import { EditNew, EditNewAfter, EditNewBefore } from "./EditNew";
import ExecuteCommand from "./ExecuteCommand";
import { FindInFiles } from "./Find";
import { Fold, Unfold } from "./Fold";
import FollowLink from "./FollowLink";
import GenerateSnippet from "./GenerateSnippet";
import GetText from "./GetText";
import Highlight from "./Highlight";
import {
  CopyContentAfter as InsertCopyAfter,
  CopyContentBefore as InsertCopyBefore,
} from "./InsertCopy";
import {
  InsertEmptyLineAbove as InsertEmptyLineBefore,
  InsertEmptyLineBelow as InsertEmptyLineAfter,
  InsertEmptyLinesAround,
} from "./InsertEmptyLines";
import InsertSnippet from "./InsertSnippet";
import { Paste } from "./Paste";
import Remove from "./Remove";
import Replace from "./Replace";
import Rewrap from "./Rewrap";
import { ScrollToBottom, ScrollToCenter, ScrollToTop } from "./Scroll";
import {
  SetSelection,
  SetSelectionAfter,
  SetSelectionBefore,
} from "./SetSelection";
import { Random, Reverse, Sort } from "./Sort";
import ToggleBreakpoint from "./ToggleBreakpoint";
import Wrap from "./Wrap";
import WrapWithSnippet from "./WrapWithSnippet";

class Actions implements ActionRecord {
  constructor(private graph: Graph) {}

  callAsFunction = new Call(this.graph);
  clearAndSetSelection = new Clear(this.graph);
  copyToClipboard = new Copy(this.graph);
  cutToClipboard = new Cut(this.graph);
  deselect = new Deselect(this.graph);
  editNew = new EditNew(this.graph);
  editNewLineAfter = new EditNewAfter(this.graph);
  editNewLineBefore = new EditNewBefore(this.graph);
  executeCommand = new ExecuteCommand(this.graph);
  extractVariable = new ExtractVariable(this.graph);
  findInWorkspace = new FindInFiles(this.graph);
  foldRegion = new Fold(this.graph);
  followLink = new FollowLink(this.graph);
  generateSnippet = new GenerateSnippet(this.graph);
  getText = new GetText(this.graph);
  highlight = new Highlight(this.graph);
  indentLine = new IndentLines(this.graph);
  insertCopyAfter = new InsertCopyAfter(this.graph);
  insertCopyBefore = new InsertCopyBefore(this.graph);
  insertEmptyLineAfter = new InsertEmptyLineAfter(this.graph);
  insertEmptyLineBefore = new InsertEmptyLineBefore(this.graph);
  insertEmptyLinesAround = new InsertEmptyLinesAround(this.graph);
  insertSnippet = new InsertSnippet(this.graph);
  moveToTarget = new Move(this.graph);
  outdentLine = new OutdentLines(this.graph);
  pasteFromClipboard = new Paste(this.graph);
  randomizeTargets = new Random(this.graph);
  remove = new Remove(this.graph);
  rename = new Rename(this.graph);
  replace = new Replace(this.graph);
  replaceWithTarget = new Bring(this.graph);
  revealDefinition = new RevealDefinition(this.graph);
  revealTypeDefinition = new RevealTypeDefinition(this.graph);
  reverseTargets = new Reverse(this.graph);
  rewrapWithPairedDelimiter = new Rewrap(this.graph);
  scrollToBottom = new ScrollToBottom(this.graph);
  scrollToCenter = new ScrollToCenter(this.graph);
  scrollToTop = new ScrollToTop(this.graph);
  setSelection = new SetSelection(this.graph);
  setSelectionAfter = new SetSelectionAfter(this.graph);
  setSelectionBefore = new SetSelectionBefore(this.graph);
  showDebugHover = new ShowDebugHover(this.graph);
  showHover = new ShowHover(this.graph);
  showQuickFix = new ShowQuickFix(this.graph);
  showReferences = new ShowReferences(this.graph);
  sortTargets = new Sort(this.graph);
  swapTargets = new Swap(this.graph);
  toggleLineBreakpoint = new ToggleBreakpoint(this.graph);
  toggleLineComment = new CommentLines(this.graph);
  unfoldRegion = new Unfold(this.graph);
  wrapWithPairedDelimiter = new Wrap(this.graph);
  wrapWithSnippet = new WrapWithSnippet(this.graph);
}

export default Actions;

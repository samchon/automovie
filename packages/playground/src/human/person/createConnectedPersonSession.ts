import type { IConnectedPersonSession } from "./IConnectedPersonSession";
import type { IConnectedPersonSessionState } from "./IConnectedPersonSessionState";

/**
 * Own the person editor's session state: the pending intent, the last refusal, the readings of the settled intent and the draft on screen. It draws nothing and evaluates nothing. A refusal preserves the draft present when it is reported, including a draft already published before cleanup failed.
 *
 * Snapshots copy the state and notes array while borrowing the draft object. This owner checks no intent ticket and retires no frames; the panel authorizes transitions and clears draft state on close after retiring the viewport.
 *
 * @evidence contracts/common.md#principled-implementation Begin clears old refusal/notes, settle records accepted-versus-draft display, and refuse/rest retain prior draft and notes, keeping presentation separate from accepted editor history.
 * @evidence contracts/common.md#clear-and-simple-design One small state owner draws/evaluates nothing and leaves current-intent validation, geometry admission and physical frame retirement to the panel/viewport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusal does not fabricate a replacement model, a draft is not accepted history and shallow snapshots do not claim deep document/model isolation.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies transition preservation, snapshot copying/borrowing and separate ticket/resource owners.
 * @evidence contracts/performance.md#efficient-algorithms Scalar transitions are constant work, note append is amortized constant and snapshot copies n notes in O(n) time/storage; nested draft document/model data are borrowed rather than cloned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Session transitions represent authored effects and snapshots need independent note arrays; no numerical result or previous snapshot is retained for reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One state retains one displayed draft and uncapped notes until begin clears notes or settle replaces the draft; the enclosing panel clears draft/messages on close and retires actual frame resources separately. Externally retained snapshots remain caller-owned.
 *
 * @author Samchon
 */
export function createConnectedPersonSession<
  Model,
>(): IConnectedPersonSession<Model> {
  const state: IConnectedPersonSessionState<Model> = {
    pending: null,
    refusal: null,
    notes: [],
    draft: null,
  };
  return {
    snapshot: (): IConnectedPersonSessionState<Model> => ({ ...state, notes: [...state.notes] }),
    begin: (waiting: string): void => {
      state.pending = waiting;
      state.refusal = null;
      state.notes = [];
    },
    settle: (draft: IConnectedPersonSessionState<Model>["draft"]): void => {
      state.pending = null;
      state.refusal = null;
      state.draft = draft;
    },
    refuse: (reason: string): void => {
      state.pending = null;
      state.refusal = reason;
    },
    rest: (): void => {
      state.pending = null;
    },
    note: (text: string): void => {
      state.notes.push(text);
    },
  };
}

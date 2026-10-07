import type { IConnectedPersonSession } from "./IConnectedPersonSession";
import type { IConnectedPersonSessionState } from "./IConnectedPersonSessionState";

/**
 * Own the person editor's session state: the pending intent, the last
 * refusal, the readings of the settled intent and the draft on screen. It
 * draws nothing and evaluates nothing. A refusal leaves the draft as it was,
 * because a refused request produced no model to replace it with.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Keeps one record of what the editor shows and why, from which its status is drawn.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Preserves the displayed person across a refusal and replaces it only on a settled intent.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Leaves the displayed draft and the accepted history untouched when an edit is refused.
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
    snapshot: () => ({ ...state, notes: [...state.notes] }),
    begin: (waiting) => {
      state.pending = waiting;
      state.refusal = null;
      state.notes = [];
    },
    settle: (draft) => {
      state.pending = null;
      state.refusal = null;
      state.draft = draft;
    },
    refuse: (reason) => {
      state.pending = null;
      state.refusal = reason;
    },
    rest: () => {
      state.pending = null;
    },
    note: (text) => {
      state.notes.push(text);
    },
  };
}

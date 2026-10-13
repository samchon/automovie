import type { IConnectedPersonSession } from "./IConnectedPersonSession";
import type { IConnectedPersonSessionState } from "./IConnectedPersonSessionState";

/**
 * Own the person editor's session state: the pending intent, the last
 * refusal, the readings of the settled intent and the draft on screen. It
 * draws nothing and evaluates nothing. A refusal leaves the draft as it was,
 * because a refused request produced no model to replace it with.
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

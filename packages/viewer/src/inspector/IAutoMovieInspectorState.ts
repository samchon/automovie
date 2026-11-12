import type { IAutoMovieCapturePlanRequest } from "@automovie/render";

/**
 * What the inspector holds between edits: the one request every control edits and the canvas draws, and the last refusal.
 *
 * @evidence contracts/development/design.md#principled-representation The page's whole state is one capture plan request, so the address, the command and the picture all derive from it; the refusal is text because it is only shown.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the viewer, produced by `createAutoMovieInspectorState` and `reduceAutoMovieInspectorState`, read by `AutoMovieInspector`. The request is render's own plan request.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A refused edit keeps the previous request beside its reason, so no half-applied request exists.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and what null means.
 */
export interface IAutoMovieInspectorState {
  /** The request drawn, as the plan grammar read it. */
  request: IAutoMovieCapturePlanRequest;

  /** Why the last edit was refused, naming the key, or null when it was accepted. */
  error: string | null;
}

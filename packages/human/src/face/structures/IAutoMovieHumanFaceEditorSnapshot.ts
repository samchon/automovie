import type { IAutoMovieHumanFaceDocument } from "./IAutoMovieHumanFaceDocument";

/**
 * The last committed face and the status of its latest requested replacement.
 * Document snapshots are copied; the model is an opaque read-only renderer value.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Separates the last valid face from pending or failed edits and exposes history availability.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Carries committed state without granting a pending build publication authority.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEditorSnapshot<
  Model,
  Document = IAutoMovieHumanFaceDocument,
> {
  /** Last successfully built document, never an invalid pending candidate. */
  document: Document;
  /** Renderer-owned immutable result for document. */
  model: Model;
  /** State of the latest requested build only. */
  status: "ready" | "building" | "error";
  /** Latest build error, or null when ready/building. */
  error: string | null;
  /** At least one earlier committed document can be restored. */
  canUndo: boolean;
  /** At least one undone document can be restored. */
  canRedo: boolean;
}

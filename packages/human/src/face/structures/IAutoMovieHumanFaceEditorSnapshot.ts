import type { IAutoMovieHumanFaceDocument } from "./IAutoMovieHumanFaceDocument";

/**
 * The last committed face and the status of its latest requested replacement.
 * Document snapshots are copied; the model is an opaque read-only renderer value.
 *
 * @evidence contracts/common.md#principled-implementation The last committed document/model pair remains visible while the latest replacement builds or errors; only successful current-generation work changes that pair/history.
 * @evidence contracts/common.md#clear-and-simple-design Copied document, opaque immutable model, current-request status/error and two history booleans separate committed state from pending work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending/invalid candidate is not the snapshot document, stale errors do not overwrite a newer request and status says nothing about clinical/visual acceptance beyond caller admission.
 * @evidence contracts/common.md#meaningful-documentation Members identify committed pair, latest-request state, error-null meaning and actual undo/redo availability.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This output schema executes no copying, build or history traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The snapshot exposes state without a model cache or repeated-request equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns its document copy while model/renderer lifetime remains with the integration; this type acquires no task or resource.
 *
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

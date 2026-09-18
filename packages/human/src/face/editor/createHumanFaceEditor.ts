import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { IAutoMovieHumanFaceEditorSnapshot } from "../structures/IAutoMovieHumanFaceEditorSnapshot";

/**
 * Transactional face editing over one injected builder. The caller supplies a
 * validated initial document/model pair and keeps renderer models immutable.
 * Every edit, reset and history traversal uses the same asynchronous builder.
 * Only the latest request can atomically publish its document, model and history.
 *
 * A rejected or superseded request resolves false. Subscribers are deliberately
 * outside this pure state owner; the browser adapter reads snapshots to render.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Implements undo, redo, reset and last-valid-state recovery under asynchronous edits.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Uses request generations to prevent late success or failure from overwriting current state.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-editor This renderer-independent state owner exposes editing and history operations; the playground adapter owns DOM controls, camera interaction and downloads.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view This package has no DOM, camera or file-picker adapter; the application binds these operations to the transactional editor.
 */
export function createHumanFaceEditor<
  Model,
  Document = IAutoMovieHumanFaceDocument,
>(props: {
  document: Document;
  model: Model;
  build: (document: Document) => Promise<Model>;
}) {
  const initial = structuredClone(props.document);
  let document = structuredClone(initial);
  let model = props.model;
  let past: Document[] = [];
  let future: Document[] = [];
  let generation = 0;
  let status: "ready" | "building" | "error" = "ready";
  let error: string | null = null;
  const request = async (
    next: Document,
    nextPast: Document[],
    nextFuture: Document[],
  ): Promise<boolean> => {
    const ticket = ++generation;
    const candidate = structuredClone(next);
    status = "building";
    error = null;
    try {
      const built = await props.build(structuredClone(candidate));
      if (ticket !== generation) return false;
      document = candidate;
      model = built;
      past = nextPast;
      future = nextFuture;
      status = "ready";
      return true;
    } catch (cause) {
      if (ticket !== generation) return false;
      status = "error";
      error = cause instanceof Error ? cause.message : String(cause);
      return false;
    }
  };
  const edit = (next: Document): Promise<boolean> =>
    request(next, [...past, document], []);
  return {
    /** A caller may edit the returned document without mutating committed state. */
    snapshot: (): IAutoMovieHumanFaceEditorSnapshot<Model, Document> => ({
      document: structuredClone(document),
      model,
      status,
      error,
      canUndo: past.length !== 0,
      canRedo: future.length !== 0,
    }),
    edit,
    /** Withdraw pending publication authority and retain the committed pair/history.
     * The application still owns cancellation and disposal of renderer work.
     */
    cancel: (): void => {
      ++generation;
      status = "ready";
      error = null;
    },
    /** Reset is an ordinary undoable edit to the initial validated document. */
    reset: (): Promise<boolean> => edit(initial),
    /** History is changed only after the restored document builds successfully. */
    undo: (): Promise<boolean> =>
      past.length === 0
        ? Promise.resolve(false)
        : request(past[past.length - 1], past.slice(0, -1), [
            document,
            ...future,
          ]),
    /** Redo uses the same admission path as a fresh edit. */
    redo: (): Promise<boolean> =>
      future.length === 0
        ? Promise.resolve(false)
        : request(future[0], [...past, document], future.slice(1)),
  };
}

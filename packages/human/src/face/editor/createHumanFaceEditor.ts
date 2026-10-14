import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import type { IAutoMovieHumanFaceEditorProps } from "../structures/IAutoMovieHumanFaceEditorProps";
import { IAutoMovieHumanFaceEditorSnapshot } from "../structures/IAutoMovieHumanFaceEditorSnapshot";

/**
 * Transactional face editing over one injected builder. The caller supplies a
 * validated initial document/model pair and keeps renderer models immutable.
 * Every edit, reset, current restoration and history traversal uses the same
 * asynchronous builder. Current restoration replaces the committed model
 * without adding or removing either history stack.
 * Only the latest request can atomically publish its document, model and history.
 *
 * A rejected or superseded request resolves false. An optional synchronous,
 * nonreentrant publication effect joins the displayed result to the same
 * generation-checked commit before its pair/history assignment. A publication
 * refusal retains that pair; arbitrary caller effects cannot be rolled back.
 * The browser adapter reads snapshots to draw controls.
 *
 * An optional caller disposer releases a successfully built model on
 * supersession or publication refusal; worker cancellation and shared renderer
 * resources remain caller-owned.
 * History has no entry/byte cap. Committed models remain opaque caller-owned
 * resources; replacement does not dispose the previous displayed model.
 *
 * @evidence contracts/common.md#principled-implementation A monotonically increasing ticket grants only the latest completed asynchronous build commit authority; owned document copies and synchronous nonreentrant publication precede pair/history assignment without an await. Current browser integrations supply admitted immutable models; arbitrary external effects remain outside rollback.
 * @evidence contracts/common.md#clear-and-simple-design One request path serves edit/reset/restore/undo/redo; injected build/publish/dispose keep numerical, renderer and cancellation responsibilities outside history bookkeeping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected/superseded requests return false; stale or publication-refused successful candidates reach an optional disposer. Publication must be synchronous/nonreentrant and refuse before external mutation; omitted cleanup remains caller responsibility, and no rejected model is certified accepted.
 * @evidence contracts/common.md#meaningful-documentation Prose gives validated initial pair, snapshot copies, latest authority, restoration/history semantics, nontransactional external effects, optional candidate disposal and uncapped history/current-model lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Document clones follow full settings size; each history transition copies stack references proportional to history length and delegated asynchronous builds retain their actual cost. Snapshot clones settings but borrows the immutable model.
 * @evidence contracts/performance.md#reuse-equivalent-work All transitions share one build/commit path; restore preserves stack identity while revalidating current settings. Matching documents do not suppress request/publication effects, and ticket invalidation prevents stale result reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The editor retains initial/current settings, current model and uncapped past/future document history; pending work can coexist until caller cancellation/completion. Optional disposal handles stale/refused candidates only, renderer retirement of old committed models stays caller-owned, and no worker/GPU handle is created here.
 */
export function createHumanFaceEditor<
  Model,
  Document = IAutoMovieHumanFaceDocument,
>(
  props: IAutoMovieHumanFaceEditorProps<Model, Document>,
): {
  snapshot: () => IAutoMovieHumanFaceEditorSnapshot<Model, Document>;
  edit: (next: Document) => Promise<boolean>;
  cancel: () => void;
  reset: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
} {
  const initial: Document = structuredClone(props.document);
  let document: Document = structuredClone(initial);
  let model: Model = props.model;
  let past: Document[] = [];
  let future: Document[] = [];
  let generation: number = 0;
  let status: "ready" | "building" | "error" = "ready";
  let error: string | null = null;
  const request: (
    next: Document,
    nextPast: Document[],
    nextFuture: Document[],
  ) => Promise<boolean> = async (
    next: Document,
    nextPast: Document[],
    nextFuture: Document[],
  ): Promise<boolean> => {
    const ticket: number = ++generation;
    const candidate: Document = structuredClone(next);
    status = "building";
    error = null;
    try {
      const built: Awaited<Model> = await props.build(
        structuredClone(candidate),
      );
      if (ticket !== generation) {
        props.dispose?.(built);
        return false;
      }
      try {
        props.publish?.(built);
      } catch (cause) {
        props.dispose?.(built);
        throw cause;
      }
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
  const edit: (next: Document) => Promise<boolean> = (
    next: Document,
  ): Promise<boolean> => request(next, [...past, document], []);
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
    /** Rebuild the committed settings without changing undo or redo history. */
    restore: (): Promise<boolean> => request(document, past, future),
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

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
 *
 * @evidence contracts/common.md#principled-implementation One request generation gates synchronous caller publication and document/model/history replacement after the injected builder succeeds; current restoration retains both history stacks and obsolete successful results use the caller's disposal effect.
 * @evidence contracts/common.md#clear-and-simple-design Every rebuilding action calls the same transaction owner with its intended history stacks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Restoration uses the ordinary injected builder and latest-request check rather than copying a stale renderer model into committed state.
 * @evidence contracts/common.md#meaningful-documentation The initial pair precondition, synchronous nonreentrant publication's failure boundary, restore versus reset semantics and obsolete-model release boundary are stated.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The editor owns transaction state and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The supplied document owns its channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The injected builder owns emitted geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Documents and opaque models retain their owners' units and frames.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The injected builder owns shared boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The caller publishes and observes committed results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The supplied document and builder own anatomical quantities.
 * @evidenceExclude contracts/anatomy.md#permitted-range The injected builder admits candidate values before commit.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The editor adds no anatomical authoring input or conversion.
 */
export function createHumanFaceEditor<
  Model,
  Document = IAutoMovieHumanFaceDocument,
>(props: IAutoMovieHumanFaceEditorProps<Model, Document>) {
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

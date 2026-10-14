import type { IAutoMovieProductionSourceGateTrace } from "./IAutoMovieProductionSourceGateTrace";

/**
 * Wrap one author-owned document reader so every read lands in the gate trace.
 *
 * A builder that hands this one reader to every validation that reads prose gets
 * a trace holding each path in the order it was read with the exact text that
 * validation saw, a repeated read included. A read that throws records nothing
 * and propagates, because the gate run it belongs to fails with it. Without a
 * trace the reader is returned as it was, so an ordinary compile or lint pays
 * nothing for it.
 *
 * @evidence contracts/common.md#principled-implementation The wrapper appends the exact returned text or null only after each successful reader call, preserving actual read order and repeats; thrown reads propagate without recording a value that was never observed.
 * @evidence contracts/common.md#clear-and-simple-design The build coordinator supplies this one reader to every document gate and source evaluation later hashes the collected observations; untraced builds use the original callback identity directly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A repeat cannot overwrite an earlier observation, absence cannot become empty text and a failed read cannot invent a dependency fact.
 * @evidence contracts/common.md#meaningful-documentation States ordered/repeated observations, thrown-read behavior and zero-wrapper behavior without a trace.
 * @evidence contracts/performance.md#efficient-algorithms Untraced selection returns an existing callback; each traced read adds one record append after the owning reader's cost, with total retained text/reference size following actual read count and text bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every effectful document read executes and is recorded independently because repeated observations may differ; this wrapper caches no text answer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure retains the supplied reader and one attempt trace; observations live with that trace until evaluation/release, without a fixed byte cap. File handles belong to the reader and the wrapper opens no task.
 */
export function recordAutoMovieProductionDocumentRead(props: {
  /** Trace of the running gate, or `undefined` when nothing records. */
  trace: IAutoMovieProductionSourceGateTrace | undefined;

  /** Reader the validation would otherwise call directly. */
  read: (relativePath: string) => string | null;
}): ((relativePath: string) => string | null) {
  const trace: IAutoMovieProductionSourceGateTrace | undefined = props.trace;
  if (trace === undefined) return props.read;
  return (relativePath: string): string | null => {
    const content: string | null = props.read(relativePath);
    trace.documents.push({ path: relativePath, content });
    return content;
  };
}

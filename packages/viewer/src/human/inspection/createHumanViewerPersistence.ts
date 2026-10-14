import type { IHumanViewerNumericalPersistenceMessage } from "./IHumanViewerNumericalPersistenceMessage.js";
import type { IHumanViewerPersistenceJob } from "./IHumanViewerPersistenceJob.js";
import { encodeHumanViewerPreviewChunks } from "./encodeHumanViewerPreviewChunks.js";

/**
 * Optional disk persistence in the existing numerical worker. There is one active write and one latest pending projection; superseded pending work is released. The page flushes only after display, so encoding cannot hold its renderer thread. Chunk-boundary yields let new builds cancel optional work. Failure is reported independently and never changes a successful preview.
 *
 * Stored, cancelled and failed outcomes describe optional preview persistence, independently of its completed numerical preview. They do not classify an entire production job or checkpoint.
 *
 * @evidence contracts/common.md#principled-implementation A displayed preview stages optional persistence, with chunk-boundary cancellation and generation-token HTTP authorization separate from the already completed numerical result.
 * @evidence contracts/common.md#clear-and-simple-design One active job and one latest pending projection keep optional encoding/writing outside renderer execution and report its own outcome.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts HTTP refusal is a persistence failure, preemption aborts optional work without deleting disk entries and no stored outcome is invented before the PUT succeeds.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes display-triggered persistence, preview success, cancellation and the lack of production checkpoint authority.
 * @evidence contracts/performance.md#efficient-algorithms Codec work is linear in model values and yields every eight pieces; pieces and their Blob representation retain a complete encoded payload during the write rather than a fixed byte-size stream.
 * @evidence contracts/performance.md#reuse-equivalent-work Superseded pending projections are replaced by the latest admitted preview; independent job keys and generation tokens remain attached to actual writes instead of being merged by timing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One active and one pending job bound projection count; preempt/discard abort active IO and release matching pending references, and active bytes persist until actual encoding/fetch settlement with no independent payload-byte cap.
 */
export function createHumanViewerPersistence(
  report: (value: IHumanViewerNumericalPersistenceMessage) => void,
  origin: string = "",
): {
  preempt: () => void;
  stage: (job: IHumanViewerPersistenceJob) => void;
  flush: () => void;
  discard: (id: number) => void;
} {
  let pending: IHumanViewerPersistenceJob | undefined;
  let active: IHumanViewerPersistenceJob | undefined;
  let controller: AbortController | undefined;
  let flushed: boolean = false;
  const run: () => void = (): void => {
    if (active !== undefined || pending === undefined || !flushed) return;
    const job: IHumanViewerPersistenceJob = pending;
    pending = undefined;
    flushed = false;
    active = job;
    const abort: AbortController = new AbortController();
    controller = abort;
    void (async (): Promise<void> => {
      const started: number = performance.now();
      const pieces: string[] = [];
      let count: number = 0;
      for (const piece of encodeHumanViewerPreviewChunks(job.value)) {
        abort.signal.throwIfAborted();
        pieces.push(piece);
        // Eight codec pieces bound uninterrupted serialization to about
        // 512 Ki UTF-16 units without changing the serialized representation.
        if (++count % 8 === 0)
          await new Promise<undefined>(
            (resolve: (value: undefined) => void): void => {
              setTimeout((): void => resolve(undefined), 0);
            },
          );
      }
      abort.signal.throwIfAborted();
      const blob: Blob = new Blob(pieces, { type: "application/json" });
      const encoded: number = performance.now();
      const response: Response = await fetch(`${origin}/cache/${job.key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Human-Generation": job.token,
        },
        body: blob,
        signal: abort.signal,
      });
      if (!response.ok)
        throw new Error(
          `Numerical cache write refused (${response.status}): ${await response.text()}`,
        );
      report({
        type: "persistence",
        key: job.key,
        state: "stored",
        cacheEncodeMs: encoded - started,
        cacheWriteMs: performance.now() - encoded,
      });
    })()
      .catch((error: unknown): void => {
        report({
          type: "persistence",
          key: job.key,
          state: abort.signal.aborted ? "cancelled" : "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally((): void => {
        active = undefined;
        controller = undefined;
        run();
      });
  };
  return {
    /** A newer foreground build preempts optional work, without touching disk entries. */
    preempt: (): void => {
      controller?.abort();
      pending = undefined;
      flushed = false;
    },

    /** Retain only the latest successful admitted preview awaiting display. */
    stage: (job: IHumanViewerPersistenceJob): void => {
      pending = job;
      flushed = false;
    },

    /** The renderer has finished; serialize at most the latest pending result. */
    flush: (): void => {
      flushed = true;
      run();
    },

    /** A released connection no longer owns a persistence request. */
    discard: (id: number): void => {
      if (pending?.id === id) {
        pending = undefined;
        flushed = false;
      }
      if (active?.id === id) controller?.abort();
    },
  };
}

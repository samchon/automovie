import type { IHumanViewerPersistenceJob } from "./IHumanViewerPersistenceJob";
import type { IHumanViewerNumericalPersistenceMessage } from "./IHumanViewerNumericalPersistenceMessage";
import { encodeHumanViewerPreviewChunks } from "./encodeHumanViewerPreviewChunks";

/**
 * Optional disk persistence in the existing numerical worker. There is one
 * active write and one latest pending projection; superseded pending work is
 * released. The page flushes only after display, so encoding cannot hold its
 * renderer thread. Chunk-boundary yields let new builds cancel optional work.
 * Failure is reported independently and never changes a successful preview.
 *
 * @evidence contracts/common.md#principled-implementation Uses the unchanged numerical codec and server admission with the producing generation's token; cancellation affects persistence alone.
 * @evidence contracts/common.md#clear-and-simple-design One active controller and one pending job bound retained results and serialize writes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not alter geometry, admission, precision or cache identity.
 * @evidence contracts/common.md#meaningful-documentation States scheduling, memory bounds, cancellation and independent failure.
 */
export function createHumanViewerPersistence(
  report: (value: IHumanViewerNumericalPersistenceMessage) => void,
  origin = "",
) {
  let pending: IHumanViewerPersistenceJob | undefined;
  let active: IHumanViewerPersistenceJob | undefined;
  let controller: AbortController | undefined;
  let flushed = false;
  const run = (): void => {
    if (active !== undefined || pending === undefined || !flushed) return;
    const job = pending;
    pending = undefined;
    flushed = false;
    active = job;
    const abort = new AbortController();
    controller = abort;
    void (async () => {
      const started = performance.now();
      const pieces: string[] = [];
      let count = 0;
      for (const piece of encodeHumanViewerPreviewChunks(job.value)) {
        abort.signal.throwIfAborted();
        pieces.push(piece);
        // Eight codec pieces bound uninterrupted serialization to about
        // 512 Ki UTF-16 units without changing the serialized representation.
        if (++count % 8 === 0)
          await new Promise<undefined>((resolve) => {
            setTimeout(() => resolve(undefined), 0);
          });
      }
      abort.signal.throwIfAborted();
      const blob = new Blob(pieces, { type: "application/json" });
      const encoded = performance.now();
      const response = await fetch(`${origin}/cache/${job.key}`, {
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
      .catch((error: unknown) => {
        report({
          type: "persistence",
          key: job.key,
          state: abort.signal.aborted ? "cancelled" : "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
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

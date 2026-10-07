import type { IServeHumanViewerHeapProps } from "./IServeHumanViewerHeapProps";

/**
 * Answer `/heap`: a heap reading after a full collection, taken outside the
 * GPU queue, since the sampled readings in `/health` include garbage not yet
 * collected. Every dedicated worker is read the same way, since its isolate
 * shares the renderer's pointer cage with the page. A reading that cannot be
 * taken answers 503 with the cause.
 *
 * @evidence contracts/common.md#principled-implementation Reports the live size after collection, not live plus garbage.
 * @evidence contracts/common.md#meaningful-documentation States the queue independence and the failure answer.
 */
export function serveHumanViewerHeap(props: IServeHumanViewerHeapProps): void {
  void Promise.all([props.readLiveHeap(), props.readWorkerHeaps()])
    .then(([live, workers]) => {
      const work = props.work();
      props.json({
        live,
        workers,
        residents: work?.residents ?? null,
        residentBytes: work?.residentBytes ?? null,
        revision: props.readyRevision(),
      });
    })
    .catch((error: unknown) => {
      props.response.statusCode = 503;
      props.json({
        error:
          "Heap reading unavailable: " +
          (error instanceof Error ? error.message : String(error)),
      });
    });
}

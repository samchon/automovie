import type { IServeHumanViewerHeapProps } from "./IServeHumanViewerHeapProps.js";

/**
 * Answer `/heap`: a heap reading after a full collection, taken outside the
 * GPU queue, since the sampled readings in `/health` include garbage not yet
 * collected. Browser workers are read independently through the supplied
 * worker-heap owner; Node numerical-process heaps are outside this renderer
 * report. A reading that cannot be taken answers 503 with the cause.
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

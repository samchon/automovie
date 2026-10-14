import type { IServeHumanViewerHeapProps } from "./IServeHumanViewerHeapProps.js";

/**
 * Answer `/heap`: a heap reading after a full collection, taken outside the GPU queue, since the sampled readings in `/health` include garbage not yet collected. Browser workers are read independently through the supplied worker-heap owner; Node numerical-process heaps are outside this renderer report. A reading that cannot be taken answers 503 with the cause.
 *
 * @evidence contracts/common.md#principled-implementation Starts collected page and browser-worker readings together and awaits both on success; Promise.all can reject before its sibling settles, whose own reader retains cleanup responsibility. Successful output adds current progress and ready-source metadata.
 * @evidence contracts/common.md#clear-and-simple-design Sampling capabilities own CDP operations while this route only assembles readings or a 503 cause response outside the GPU queue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable readings are not fabricated as zero, and browser-isolate heaps are not mislabeled as Node numerical or physical GPU memory.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes postcollection scope, browser worker ownership, current progress and measurement refusal.
 * @evidence contracts/performance.md#efficient-algorithms Two sampling owners run concurrently and result assembly scales with returned worker records; collection/CDP enumeration and transport dominate actual measurement cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Heaps change independently of source identity, so each request obtains new readings while merely borrowing the latest progress record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful output joins both samplers; a rejected Promise.all may answer before its sibling settles, and each reader keeps its own remaining CDP cleanup responsibility, while this response retains only completed measurement records until publication.
 */
export function serveHumanViewerHeap(props: IServeHumanViewerHeapProps): void {
  void Promise.all([props.readLiveHeap(), props.readWorkerHeaps()])
    .then(([live, workers]: [Awaited<ReturnType<IServeHumanViewerHeapProps["readLiveHeap"]>>, Awaited<ReturnType<IServeHumanViewerHeapProps["readWorkerHeaps"]>>]): void => {
      const work: ReturnType<IServeHumanViewerHeapProps["work"]> = props.work();
      props.json({
        live,
        workers,
        residents: work?.residents ?? null,
        residentBytes: work?.residentBytes ?? null,
        revision: props.readyRevision(),
      });
    })
    .catch((error: unknown): void => {
      props.response.statusCode = 503;
      props.json({
        error:
          "Heap reading unavailable: " +
          (error instanceof Error ? error.message : String(error)),
      });
    });
}

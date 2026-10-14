/**
 * Coalesce catalogue republication requests into one rebuild per turn of the event loop. Admission verdicts arrive in bursts of hundreds when a page becomes ready; rebuilding the catalogue synchronously for each of them blocks ordinary requests on that same thread. A request made while one is scheduled is folded into it, so a burst costs one rebuild. The queued callback is not cancellable through this adapter and belongs to the server event-loop lifetime; a throwing rebuild surfaces on that loop.
 *
 * @evidence contracts/common.md#principled-implementation A scheduled flag coalesces synchronous bursts and is cleared before rebuilding, allowing work requested during rebuilding to schedule a later turn.
 * @evidence contracts/common.md#clear-and-simple-design One boolean and one immediate callback express the coalescing policy without a catalogue cache or retry queue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual rebuild runs on the event loop and a thrown cause is not relabeled as successful publication.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains burst coalescing, event-loop lifetime and the lack of cancellation or exception interception.
 * @evidence contracts/performance.md#efficient-algorithms Each request performs constant-time flag work; one rebuild is scheduled per pending turn, with catalogue traversal delegated to the supplied owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Requests while scheduled are equivalent requests to rebuild from current owner state, rather than distinct snapshots whose historical contents need replay.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one immediate callback is pending per adapter; it retains the rebuild closure until execution and exposes no cancellation seam.
 */
export function createHumanViewerCatalogueRepublish(
  rebuild: () => void,
): () => void {
  let scheduled: boolean = false;
  return (): void => {
    if (scheduled) return;
    scheduled = true;
    setImmediate((): void => {
      scheduled = false;
      rebuild();
    });
  };
}

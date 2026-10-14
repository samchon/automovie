/**
 * One page V8 isolate's `Runtime.getHeapUsage` reading. It reports JavaScript heap usage and reservation, with same-isolate frames included. These two fields do not establish complete external backing-store, worker, GPU or process memory.
 *
 * @evidence contracts/common.md#principled-implementation Projects Runtime.getHeapUsage usedSize/totalSize from the actual resident page V8 isolate through its independent CDP session.
 * @evidence contracts/common.md#clear-and-simple-design Keeps isolate heap bytes distinct from worker usage, typed-array accounting and complete native/GPU memory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Same-origin iframe sharing is a runtime premise, and these two fields do not guarantee coverage of external backing stores or all process resources.
 * @evidence contracts/common.md#meaningful-documentation Defines bytes used by live/uncollected heap objects and V8 reserved heap bytes; collection requests remain separate from the reading.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no query; its browser owner issues actual CDP reads and optional garbage collection.
 * @evidence contracts/performance.md#reuse-equivalent-work Reader/session capabilities are reused for one page, but usage is refreshed for pressure decisions rather than cached as permanent capacity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record retains two numbers; page/browser closure owns its CDP capability and the reading transfers no native memory ownership.
 *
 * @author Samchon
 */
export interface IHumanViewerHeapUsage {
  /** Bytes of live and not yet collected objects in the heap. */
  usedSize: number;

  /** Bytes the heap has reserved from the system. */
  totalSize: number;
}

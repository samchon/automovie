import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap.js";

/**
 * What the resident trim reads and acts through.
 *
 * @evidence contracts/common.md#principled-implementation Heap trimming sums page/worker usedSize, applies per-domain transient headroom and awaits eviction of unused page residents.
 * @evidence contracts/common.md#clear-and-simple-design Separates byte limit/target, actual isolate readings and capture-window feedback without owning numerical workers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Heap/array accounting are distinct and neither proves process memory or future allocation fit; insufficient headroom remains best effort and capture can continue.
 * @evidence contracts/common.md#meaningful-documentation Identifies byte units, shown-resident protection, observed peaks and seed estimates; target below limit is checked but finite/nonnegative values remain caller premises.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bindings perform no trim; each sum visits worker readings, and eviction rereads page heap for each actually released resident.
 * @evidence contracts/performance.md#reuse-equivalent-work Three domain estimates reuse their largest observed transient; heap readings refresh before decisions instead of reusing a prior fit as admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trim retains three headroom numbers and one decision, borrowing worker runtimes; page eviction settles under its cache owner and physical collection is not guaranteed.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerResidentTrimProps {
  /**
   * Bytes of JS heap the renderer's isolates together may use before page residents are released.
   */
  limit: number;

  /**
   * Requested byte target below `limit`; trim can finish above it when no unused resident remains, and later capture capacity is not guaranteed.
   */
  target: number;

  /**
   * Read the page isolate's heap after its collection request settles when `collect` is set; this does not guarantee every garbage object was released.
   *
   * @evidence contracts/common.md#principled-implementation Reads actual page-isolate used heap, asking its existing collector first when collect is true.
   * @evidence contracts/common.md#clear-and-simple-design Keeps the page CDP/heap reader with the browser owner and exposes its measured usage to trim decisions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A collection request is not proof all garbage or GPU/process bytes were released; usedSize is one isolate reading.
   * @evidence contracts/common.md#meaningful-documentation collect selects collection before observation; returned byte quantities remain separate from resident typed-array accounting.
   * @evidence contracts/performance.md#efficient-algorithms One browser heap query occurs per sum and after each successful eviction; total calls grow with actual evicted residents.
   * @evidence contracts/performance.md#reuse-equivalent-work Page pressure is reread after effects because previous usage cannot prove current room; the host reuses only its reader/connection.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The browser owner retains CDP/page handles; the trim operation owns the returned task until settlement and does not close the page.
   */
  page: (collect: boolean) => Promise<IHumanViewerHeapUsage>;

  /**
   * Read observed worker isolates' heaps after their collection requests settle when `collect` is set; this does not establish complete process memory.
   *
   * @evidence contracts/common.md#principled-implementation Reads heap usage for each currently observed worker isolate, optionally requesting collection before its reading.
   * @evidence contracts/common.md#clear-and-simple-design Leaves worker discovery and instrumentation with the browser heap owner while trim only sums returned usedSize.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Worker usage is counted without terminating workers; the array cannot certify complete process/GPU memory or future fit.
   * @evidence contracts/common.md#meaningful-documentation collect requests existing per-worker collection and the result lists actual worker identity/readings rather than domain headroom estimates.
   * @evidence contracts/performance.md#efficient-algorithms Discovery/query and returned array scale with worker count; each heap sum reduces that array once.
   * @evidence contracts/performance.md#reuse-equivalent-work The reader may reuse its instrumentation, but usage is refreshed for each required sum and cannot be cached as permanent capacity.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Worker lifetimes remain their numerical owners'; only transient reading records are borrowed, and this callback retires no worker.
   */
  workers: (collect: boolean) => Promise<IHumanViewerWorkerHeap[]>;

  /**
   * Ask the page to release its least recently used resident other than the one on screen; false when none is left.
   *
   * @evidence contracts/common.md#principled-implementation Asks the page resident cache to release its oldest evictable resident while preserving the shown resident.
   * @evidence contracts/common.md#clear-and-simple-design Keeps candidate order and native resource release with the cache owner instead of guessing unused meshes from heap totals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Logical eviction alone is not physical release; rejection must propagate and false means no releasable resident remains.
   * @evidence contracts/common.md#meaningful-documentation The promise settles the cache's actual retirement attempt; trim stops on false even if the byte target is still exceeded.
   * @evidence contracts/performance.md#efficient-algorithms Cache selection/retirement cost follows its resident population and resources; trim invokes it only while measured pressure exceeds its bound.
   * @evidence contracts/performance.md#reuse-equivalent-work Eviction effects are not skipped for equal heap readings; each successful release is followed by a fresh page heap observation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The cache retains failed retirement causes/resources; the shown resident remains live and the trim callback owns no second disposer.
   */
  evict: () => Promise<boolean>;

  /**
   * Start a window of page heap samples taken during one capture.
   *
   * @evidence contracts/common.md#principled-implementation Starts the existing page-heap sampling window after pre-capture room handling has selected its starting page reading.
   * @evidence contracts/common.md#clear-and-simple-design Keeps observed capture peaks in the heap gauge while domain learning compares them with the trim owner's starting value.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Marking is not a numerical build or planned-memory denominator; missing later samples remain null rather than an invented peak.
   * @evidence contracts/common.md#meaningful-documentation Called once per known-domain capture preparation after any required collection/eviction, before its actual page work.
   * @evidence contracts/performance.md#efficient-algorithms Resetting the gauge window is fixed state work; subsequent observation cost follows actual heap samples.
   * @evidence contracts/performance.md#reuse-equivalent-work The same gauge is reused but a new mark invalidates the prior capture window; peaks cannot be shared across unrelated captures.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The gauge owns its active window until the next mark; this callback starts no timer or numerical task by contract.
   */
  mark: () => void;

  /**
   * The largest page heap sample since `mark`, or null when none arrived.
   *
   * @evidence contracts/common.md#principled-implementation Reads the largest observed page-heap sample since the last mark for measured domain transient learning.
   * @evidence contracts/common.md#clear-and-simple-design Exposes an optional scalar peak rather than copying a full sample history into the trim service.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null means no observation arrived; measured peak is not complete memory, prediction certainty or a guaranteed worst-case bound.
   * @evidence contracts/common.md#meaningful-documentation Peak bytes are compared against pre-capture page usedSize; only larger observed deltas raise that domain's retained estimate.
   * @evidence contracts/performance.md#efficient-algorithms Reading an aggregated peak is constant state access; maintaining it belongs to the heap gauge's actual sample processing.
   * @evidence contracts/performance.md#reuse-equivalent-work The gauge reuses aggregation within the current marked window; a new mark changes identity and the previous peak is not current evidence.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The trim owner retains only three learned numbers; the gauge owns sample storage and this callback returns no native handle.
   */
  windowPeak: () => number | null;

  /**
   * Initial transient page-heap estimates by domain, in bytes. Current host configuration uses a recorded person observation and zero for unobserved face/body domains; subsequent captures retain larger sampled increases.
   */
  seeds: Record<"face" | "body" | "person", number>;
}

/**
 * One reading of the resident page's JavaScript heap, as the renderer's own
 * V8 isolate reports it through `Runtime.getHeapUsage`. The page and its
 * same-origin viewport iframes share that isolate, so the reading covers every
 * resident model, witness and cache string the viewer holds.
 *
 * @evidence contracts/common.md#principled-implementation Reads the isolate's own accounting instead of estimating sizes from document counts.
 * @evidence contracts/common.md#meaningful-documentation States which isolate is measured and what it includes.
 * @author Samchon
 */
export interface IHumanViewerHeapUsage {
  /** Bytes of live and not yet collected objects in the heap. */
  usedSize: number;

  /** Bytes the heap has reserved from the system. */
  totalSize: number;
}

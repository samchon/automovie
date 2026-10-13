/**
 * The largest successful resident-page heap sample since server start, labeled with the work event that triggered its asynchronous query. That event is descriptive provenance rather than exact contemporaneous causation.
 *
 * @evidence contracts/common.md#principled-implementation Associates the largest successful page-heap reading with the work event that triggered its asynchronous sample.
 * @evidence contracts/common.md#clear-and-simple-design Keeps scalar byte peak and descriptive document/source/phase provenance together without storing a complete sample history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The trigger is not exact contemporaneous stage causation; within-stage or absorbed events can exceed the sampled peak.
 * @evidence contracts/common.md#meaningful-documentation Documents used bytes and sample-completion ISO time, with revision/doc/phase taken from the initiating work observation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Peak records perform no query; the gauge updates only when a successfully sampled usedSize exceeds the prior value.
 * @evidence contracts/performance.md#reuse-equivalent-work The gauge retains this maximum for server-lifetime reporting, while per-capture learning has a separate marked-window peak.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One record/string set remains until a larger sample replaces it; it owns no page, worker or numerical model arrays.
 *
 * @author Samchon
 */
export interface IHumanViewerHeapPeak {
  /** Bytes in use at the peak. */
  usedSize: number;

  /** Source revision reported by the work event that triggered sampling. */
  revision: string;

  /** Document reported by the triggering work event. */
  doc: string;

  /** Work phase that triggered this asynchronous reading. */
  phase: string;

  /** ISO wall-clock time when the successful reading completed. */
  at: string;
}

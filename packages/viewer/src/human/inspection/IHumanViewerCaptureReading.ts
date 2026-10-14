/**
 * Actual page-bridge PNG/timing readings joined with the server evaluation start timestamp. Page durations use that page's performance.now clock; waited is a server clock timestamp and is not itself a measured duration.
 *
 * @evidence contracts/common.md#principled-implementation The transport keeps actual PNG output, build-count delta and page durations separate from the server evaluation-start timestamp.
 * @evidence contracts/common.md#clear-and-simple-design One reading shape connects the page evaluation result with the capture owner's existing timing projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fields do not certify current source after arbitrary concurrent edits, anatomical validity or delivery evidence; final revision/staleness belongs to capture admission.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish page duration clocks, server timestamp units and completed page-output measurements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This transport shape selects no page rendering, image encoding or measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A capture reading reports one execution and defines no equivalence policy for cached PNG or timing values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reading carries one PNG string and numeric spans until its capture caller releases them; it owns no page, browser or GPU resource.
 *
 * @author Samchon
 */
export interface IHumanViewerCaptureReading {
  /** PNG data URL returned by the finished page bridge. */
  png: string;

  /** Numerical builds completed during this show operation. */
  built: number;

  /** Duration of the page's latest numerical build; a cache-hit delta can be zero. */
  buildMs: number;

  /** Elapsed page show time in milliseconds. */
  showMs: number;

  /** Elapsed synchronous PNG bridge read time in milliseconds. */
  pngMs: number;

  /** Actual named page-stage durations in milliseconds. */
  spans: Record<string, number>;

  /** Server performance.now timestamp immediately before evaluation. */
  waited: number;
}

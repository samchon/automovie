import type {
  AutoMovieRenderMetric,
  IAutoMovieRenderObservation,
  IAutoMovieRenderObservationBreach,
  IAutoMovieRenderReport,
} from "@automovie/interface";

/**
 * Check what one capture actually drew against the report that cleared it.
 *
 * Report measurements are exact or conservative preflight bounds. Drawing less
 * is expected after culling and level-of-detail selection, while drawing more
 * proves that the report describes a different render inventory. A metric for
 * which the report produced no number remains `unchecked`; absence of a breach
 * never turns an analysis that did not run into agreement.
 *
 * @evidence contracts/common.md#principled-implementation Each observable metric is compared with its unique finite non-negative report bound; duplicate findings, absent bounds and unknown observed counts remain unchecked rather than certifying agreement.
 * @evidence contracts/common.md#clear-and-simple-design The function owns the report-versus-capture comparison only, using one table to associate observation fields with report metrics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No metric is defaulted to zero and no duplicate finding wins by position; greater observed counts become breaches while smaller counts remain admissible after culling.
 * @evidence contracts/common.md#meaningful-documentation The comment explains conservative bounds, culling and unchecked measurements; return fields distinguish complete agreement, breaches and unknown metrics.
 * @evidence contracts/performance.md#efficient-algorithms For R findings, one map-building traversal plus seven fixed observation comparisons costs O(R) time and O(R) indexed entries.
 * @evidence contracts/performance.md#reuse-equivalent-work The per-call finding map supplies all observation lookups without repeatedly scanning the report; results cannot be reused for a different capture observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and duplicate sets are call-local, and the returned breach and unchecked arrays contain at most seven entries with no report or graphics-context ownership.
 */
export function auditAutoMovieRenderObservation(props: {
  /** The report that cleared the artifact. */
  report: IAutoMovieRenderReport;
  /** What the captured scene actually submits. */
  observed: IAutoMovieRenderObservation;
}): {
  /** Whether every observable metric was measured and stayed inside its bound. */
  agrees: boolean;
  /** Every observed value above its report bound, in metric order. */
  breaches: IAutoMovieRenderObservationBreach[];
  /** Observable metrics for which the report produced no number. */
  unchecked: AutoMovieRenderMetric[];
} {
  const observable: ReadonlyArray<
    [AutoMovieRenderMetric, keyof IAutoMovieRenderObservation]
  > = [
    ["triangles", "triangles"],
    ["drawCalls", "drawCalls"],
    ["materials", "materials"],
    ["textures", "textures"],
    ["lights", "lights"],
    ["shadowMaps", "shadowMaps"],
    ["instanceSlots", "instanceSlots"],
  ];
  const measured: Map<AutoMovieRenderMetric, number | null> = new Map();
  const duplicate: Set<AutoMovieRenderMetric> = new Set();
  for (const finding of props.report.findings) {
    if (measured.has(finding.metric)) duplicate.add(finding.metric);
    else measured.set(finding.metric, finding.measured);
  }
  const breaches: IAutoMovieRenderObservationBreach[] = [];
  const unchecked: AutoMovieRenderMetric[] = [];
  for (const [metric, field] of observable) {
    const bound: number | null = measured.get(metric) ?? null;
    const observed: number | null = props.observed[field];
    if (
      duplicate.has(metric) ||
      bound === null ||
      Number.isFinite(bound) === false ||
      bound < 0 ||
      observed === null ||
      Number.isFinite(observed) === false ||
      observed < 0
    ) {
      unchecked.push(metric);
      continue;
    }
    if (observed > bound) breaches.push({ metric, bound, observed });
  }
  return {
    agrees: breaches.length === 0 && unchecked.length === 0,
    breaches,
    unchecked,
  };
}

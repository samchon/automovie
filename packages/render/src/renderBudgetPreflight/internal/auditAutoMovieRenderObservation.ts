import type {
  AutoMovieRenderMetric,
  IAutoMovieRenderObservation,
  IAutoMovieRenderObservationAudit,
  IAutoMovieRenderObservationAuditRequest,
  IAutoMovieRenderObservationBreach,
} from "@automovie/interface";

/*
 * Check what one capture actually drew against the report that cleared it.
 *
 * Report measurements are exact or conservative preflight bounds. Drawing less
 * is expected after culling and level-of-detail selection, while drawing more
 * proves that the report describes a different render inventory. A metric for
 * which the report produced no number remains `unchecked`; absence of a breach
 * never turns an analysis that did not run into agreement.
 */
export function auditAutoMovieRenderObservation(
  props: IAutoMovieRenderObservationAuditRequest,
): IAutoMovieRenderObservationAudit {
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
      bound < 0 ||
      observed === null ||
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

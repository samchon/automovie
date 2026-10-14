import type { IAutoMovieHumanEndpointScale } from "@automovie/human";

import type { IConnectedFaceControlMetric } from "./IConnectedFaceControlMetric";

/**
 * Describe what one endpoint of a face channel moves: the amount (one weight, or the source degrees or millimetres per weight), RMS over every resident vertex, peak displacement and reported moved-vertex count. The supplied scale reader owns these statistics; none establishes anatomical validity.
 *
 * @evidence contracts/common.md#principled-implementation Signed endpoint amount uses the supplied display factor, displacement and peak convert metres to millimetres, and moved-vertex count remains distinct from the all-resident RMS denominator.
 * @evidence contracts/common.md#clear-and-simple-design The formatter consumes already measured scale metadata without repeating sparse-row or articulation evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source units and displacement statistics are not represented as personal clinical measurements or collision validity.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies source versus authored units, all-resident RMS, peak and moved count with numerical ownership and validity limits.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of scalar conversions and two-decimal formatting operations create one constant-field string in O(l) output characters, without mesh traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure formatting call coordinates no numerical cache; measured scale reuse belongs to the control mount.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned string escapes and formatting acquires no worker, texture or native handle.
 */
export function describeConnectedFaceControlScale(
  sign: string,
  scale: IAutoMovieHumanEndpointScale,
  metric: IConnectedFaceControlMetric | null = null,
): string {
  const measured: number | null =
    metric === null
      ? null
      : sign === "-"
        ? -metric.perWeight
        : metric.perWeight;
  const amount: string =
    measured === null
      ? `${sign}1`
      : `${measured >= 0 ? "+" : ""}${measured.toFixed(2)}${metric!.unit}`;
  return (
    `${amount} moves ${(scale.displacement * 1000).toFixed(2)} mm rms, ` +
    `${(scale.peak * 1000).toFixed(2)} mm peak on ${scale.vertices} vertices`
  );
}

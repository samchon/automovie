import type { IAutoMovieHumanEndpointScale } from "@automovie/human";

import type { IConnectedFaceControlMetric } from "./IConnectedFaceControlMetric";

/**
 * Describe what one endpoint of a face channel moves: the amount (one weight,
 * or the measured degrees or millimetres per weight) and the RMS and peak
 * displacement over the moved vertices.
 *
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Shows endpoint displacement beside each fine control.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Tells the user what one endpoint of a face channel moves and by how much.
 */
export function describeConnectedFaceControlScale(
  sign: string,
  scale: IAutoMovieHumanEndpointScale,
  metric: IConnectedFaceControlMetric | null = null,
): string {
  const measured = metric === null ? null : sign === "-" ? -metric.perWeight : metric.perWeight;
  const amount = measured === null
    ? `${sign}1`
    : `${measured >= 0 ? "+" : ""}${measured.toFixed(2)}${metric!.unit}`;
  return `${amount} moves ${(scale.displacement * 1000).toFixed(2)} mm rms, ` +
    `${(scale.peak * 1000).toFixed(2)} mm peak on ${scale.vertices} vertices`;
}

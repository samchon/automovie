import type { IAutoMovieSamplePhysicalTarget } from "@automovie/interface";

/**
 * Own sample/pose containers before replacing their fields. Metric vector
 * values remain borrowed immutable inputs until replaced.
 */
export function copyPhysicalTarget(
  source: IAutoMovieSamplePhysicalTarget.IResult,
): IAutoMovieSamplePhysicalTarget.IResult {
  return { ...source, pose: { ...source.pose } };
}

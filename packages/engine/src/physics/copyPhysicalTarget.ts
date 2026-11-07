import type { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Own sample/pose containers before replacing their fields. Metric vector values remain borrowed immutable inputs until replaced. */
export function copyPhysicalTarget(
  source: ReturnType<typeof samplePhysicalTarget>,
): ReturnType<typeof samplePhysicalTarget> {
  return { ...source, pose: { ...source.pose } };
}

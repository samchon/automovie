import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Convert azimuth and elevation degrees to a centre-to-eye direction.
 *
 * @evidence contracts/common.md#principled-implementation Sine/cosine of the two radian angles form the canonical inspection direction.
 * @evidence contracts/common.md#clear-and-simple-design The plan owns angle admission while this owner supplies its arithmetic representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unit length holds up to floating-point trigonometric rounding; invalid angles are not clamped or revalidated here.
 * @evidence contracts/common.md#meaningful-documentation Positive elevation raises Y and azimuth sweeps the X/Z plane.
 * @evidence contracts/performance.md#efficient-algorithms Fixed angle conversion and trigonometry produce one vector.
 * @evidence contracts/performance.md#reuse-equivalent-work One direction formula is reused across ring construction without per-angle caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a fresh vector escapes and no plan or camera state is retained.
 */
export function subjectInspectionSubjectViewDirection(
  azimuthDeg: number,
  elevationDeg: number
): IAutoMovieVector3 {
  const azimuth: number = azimuthDeg * (Math.PI / 180);
  const elevation: number = elevationDeg * (Math.PI / 180);
  const horizontal: number = Math.cos(elevation);
  return {
    x: Math.sin(azimuth) * horizontal,
    y: Math.sin(elevation),
    z: Math.cos(azimuth) * horizontal,
  };
}

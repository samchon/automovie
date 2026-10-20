import { IAutoMovieFog } from "@automovie/interface";

/**
 * FogExp2 transmittance at axial camera depth in metres:
 * T(d) = exp(-(density * d)^2). Consumers blend subject * T with fog.color *
 * (1 - T), following the same atmosphere law selected by viewer fog setup.
 *
 * Depth is camera-forward distance rather than radial range. The squared law
 * is even in depth, so a behind-camera point has the same attenuation as its
 * positive-depth counterpart; consumers own visibility separately. Binary64
 * evaluation is a prediction of the shader law, not exact pixel agreement
 * with GPU precision, lighting, compositing or tone mapping.
 *
 * Null or absent fog returns one. Scene-admitted density and finite depth are
 * caller premises; nonfinite direct inputs follow ordinary exponential arithmetic.
 *
 * @evidence contracts/common.md#principled-implementation Exponentiating the negative squared optical depth follows the viewer's FogExp2 attenuation law using axial camera depth; shader floating-point precision can differ from this binary64 calculation.
 * @evidence contracts/common.md#clear-and-simple-design Offline subject-contribution predictions share the atmosphere law selected by viewer fog construction, with color blending left to those consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null or absent fog explicitly means unit transmittance; density and depth are not adjusted to make a rendered prediction appear closer.
 * @evidence contracts/common.md#meaningful-documentation Gives the exponential formula, camera-depth convention, behind-camera symmetry, absent-fog result and admitted-input precision limits.
 * @evidence contracts/performance.md#efficient-algorithms Two products, one negation and one exponential take constant time with no geometry traversal or allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Density and depth define one independent scalar query, so the function coordinates no repeated scene work or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned primitive retains no fog record, shader, renderer or temporary object after computation.
 */
export const sceneFogTransmittance: (
  fog: IAutoMovieFog | null | undefined,
  depthMeters: number,
) => number = (
  fog: IAutoMovieFog | null | undefined,
  depthMeters: number,
): number => {
  if (fog === null || fog === undefined) return 1;
  const opticalDepth: number = fog.density * depthMeters;
  return Math.exp(-(opticalDepth * opticalDepth));
};

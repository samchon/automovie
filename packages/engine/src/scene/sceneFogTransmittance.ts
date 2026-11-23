import { IAutoMovieFog } from "@automovie/interface";

/**
 * FogExp2 transmittance at axial camera depth in metres: T(d) = exp(-(density *
 * d)^2). Consumers blend subject * T with fog.color * (1 - T), following the
 * same atmosphere law selected by viewer fog setup.
 *
 * Depth is camera-forward distance rather than radial range. The squared law is
 * even in depth, so a behind-camera point has the same attenuation as its
 * positive-depth counterpart; consumers own visibility separately. Binary64
 * evaluation is a prediction of the shader law, not exact pixel agreement with
 * GPU precision, lighting, compositing or tone mapping.
 *
 * Null or absent fog returns one. Scene-admitted density and finite depth are
 * caller premises; nonfinite direct inputs follow ordinary exponential
 * arithmetic.
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

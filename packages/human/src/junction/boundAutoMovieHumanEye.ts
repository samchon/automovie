import { planAutoMovieHumanEye } from "./planAutoMovieHumanEye";

/**
 * Radius of a sphere about the eye joint enclosing the generated sclera and cornea, in millimetres.
 *
 * The eye plan owns both surfaces. On each axisymmetric meridian the squared distance from the joint is quadratic in the axial direction cosine. Its maximum is at an interval end or its sole stationary point, so this bound uses the actual ellipsoid and stretched corneal cap rather than an independent globe allowance. A rotation about the eye joint preserves the bound.
 *
 * @param plan The same dimensions and offset consumed by the eyeball mesh generator
 * @returns Enclosing radius, before any lid allowance
 */
export function boundAutoMovieHumanEye(
  plan: planAutoMovieHumanEye.IPlan,
): number {
  const across: number = Math.max(plan.transverse, plan.vertical);
  const mean: number = (plan.transverse + plan.vertical) / 2;
  const sclera: number = maximum(
    across,
    plan.depth,
    plan.offset,
    -1,
    plan.limbusZ / plan.depth,
  );
  const cornea: number = maximum(
    (plan.cornea * across) / mean,
    plan.cornea,
    plan.offset + plan.corneaZ,
    Math.sqrt(1 - (plan.limbus / plan.cornea) ** 2),
    1,
  );
  return Math.sqrt(Math.max(sclera, cornea));
}

/** Maximum squared distance of a stretched spherical meridian over its stated direction-cosine interval. */
function maximum(
  across: number,
  axial: number,
  offset: number,
  lower: number,
  upper: number,
): number {
  const quadratic: number = axial * axial - across * across;
  const evaluate: (t: number) => number = (t: number): number =>
    across * across * (1 - t * t) + (offset + axial * t) ** 2;
  let value: number = Math.max(evaluate(lower), evaluate(upper));
  if (quadratic < 0) {
    const stationary: number = (-offset * axial) / quadratic;
    if (stationary > lower && stationary < upper)
      value = Math.max(value, evaluate(stationary));
  }
  return value;
}

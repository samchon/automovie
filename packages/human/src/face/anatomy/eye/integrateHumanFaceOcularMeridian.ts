import type { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";

/**
 * Measure the admitted corneal meridian from the apex to radial coordinate
 * `end`, in metres. The actual optical profile supplies the derivative, so
 * this reads the same cap the optical mesh and its contact surface use.
 *
 * Composite Simpson refinement integrates sqrt(1 + G'(r)^2). Its consecutive
 * estimates must agree within 32 binary64 epsilons of their metric scale;
 * that bound controls integration arithmetic rather than tissue clearance.
 * A nonconvergent profile refuses instead of supplying an estimated sphere.
 */
export function integrateHumanFaceOcularMeridian(
  profile: ReturnType<typeof resolveHumanFaceOpticalProfile>,
  end: number,
): number {
  if (!Number.isFinite(end) || end < 0 || end > profile.limbus)
    throw new Error(
      "Ocular meridian integration needs a cap radius in its admitted domain.",
    );
  if (end === 0) return 0;
  const integrand = (r: number): number => Math.hypot(1, profile.slope(r));
  let previous: number | undefined;
  for (let cells = 8; cells <= 8192; cells *= 2) {
    const step = end / cells;
    let sum = integrand(0) + integrand(end);
    for (let at = 1; at < cells; at++)
      sum += (at % 2 === 0 ? 2 : 4) * integrand(at * step);
    const length = (step * sum) / 3;
    if (!Number.isFinite(length))
      throw new Error(
        "Ocular meridian integration must retain a finite metric length.",
      );
    if (
      previous !== undefined &&
      Math.abs(length - previous) <=
        32 * Number.EPSILON * Math.max(length, previous)
    )
      return length;
    previous = length;
  }
  throw new Error(
    "Ocular meridian integration did not converge at binary64 metric precision.",
  );
}

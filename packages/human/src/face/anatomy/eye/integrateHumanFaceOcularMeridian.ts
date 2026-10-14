import type { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";

/**
 * Measure the admitted corneal meridian from the apex to radial coordinate
 * `end`, in metres. The actual optical profile supplies the derivative, so
 * this reads the same cap the optical mesh and its contact surface use.
 *
 * Composite Simpson refinement integrates sqrt(1 + G'(r)^2). Its consecutive
 * estimates must agree within 32 binary64 epsilons of their metric scale;
 * this is a consecutive-estimate stopping criterion, not a rigorous enclosure
 * of the integration error or a tissue clearance.
 * A nonconvergent profile refuses instead of supplying an estimated sphere.
 *
 * @evidence contracts/common.md#principled-implementation Composite Simpson refinement integrates the actual admitted cap slope over the requested radial domain.
 * @evidence contracts/common.md#clear-and-simple-design One canonical numerical arc owner reads the same profile used by drawing and analytic contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Consecutive binary64 estimate agreement is a stopping criterion, not a rigorous integral-error enclosure or tissue-clearance proof.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metres, requested cap domain, finite convergence and the limited stopping criterion.
 * @evidence contracts/performance.md#efficient-algorithms Doubling 8..8192 cells bounds total slope evaluations; each refinement rebuilds its Simpson sum, including profile evaluation cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured caller profile evaluators are reused across samples, while successive estimates retain only the previous scalar.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one arc length returns; numerical loop state expires and no integration cache/resource is acquired.
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
  const integrand: (r: number) => number = (r: number): number =>
    Math.hypot(1, profile.slope(r));
  let previous: number | undefined;
  for (let cells: number = 8; cells <= 8192; cells *= 2) {
    const step: number = end / cells;
    let sum: number = integrand(0) + integrand(end);
    for (let at: number = 1; at < cells; at++)
      sum += (at % 2 === 0 ? 2 : 4) * integrand(at * step);
    const length: number = (step * sum) / 3;
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

/**
 * Jacobi-preconditioned conjugate gradients on the sparse Dirichlet matrix.
 * The recurrence follows Saad, Iterative Methods for Sparse Linear Systems,
 * second edition, section 9.2, Algorithm 9.1:
 * https://www-users.cse.umn.edu/~saad/IterMethBook_2ndEd.pdf
 *
 * A row-normalized residual has displacement units (mm). The tolerance is
 * 128 floating-point epsilons times the boundary scale, with a 1 mm floor.
 * It measures equation satisfaction, not a universal forward-error bound:
 * nearly singular geometry can amplify residuals. Analytic fixtures separately
 * check the displacement error. Recompute b-Ax before accepting convergence;
 * if recursive roundoff hid a remaining residual, restart from the true one.
 *
 * Exact-arithmetic CG needs at most n steps. Four times n allows floating-point
 * loss of conjugacy while bounding work; exhausting it is an explicit refusal,
 * never permission to return an unfinished interpolation. The host blender
 * supplies the symmetric positive definite operator and its positive diagonal;
 * this solver detects numerical failure, not general matrix admissibility.
 * Inputs retain free-vertex ordering; rhs is a weighted millimetre displacement
 * and scale is the largest boundary displacement, with a 1 mm floor. The result
 * contains free XYZ-axis displacements only; the host retains exact pins.
 * Changing this solve changes attached/refined skin and derived face exports.
 * Only local arrays are changed, so failure cannot leave a partially edited
 * caller mesh.
 *
 * @evidence contracts/common.md#principled-implementation Jacobi-preconditioned conjugate gradients solves a symmetric positive definite system in at most n exact steps; the caller (blendPortraitSkin) supplies the graph-Laplacian operator, whose Dirichlet reduction is positive definite when every free vertex reaches a pin. The residual is recomputed from b - Ax before convergence is accepted, so recursive roundoff cannot hide an unfinished solve, and exhausting 4n iterations or a non-positive step refuses instead of returning a partial interpolation.
 * @evidence contracts/common.md#clear-and-simple-design One solver with one stopping rule; the operator and its diagonal belong to the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case: a numerical breakdown or non-convergence throws and no compensating path retries.
 * @evidence contracts/common.md#meaningful-documentation Cites the algorithm, states the tolerance (128 epsilons of the boundary scale with a 1 mm floor), the units of the residual and what a converged residual does not prove.
 * @evidence contracts/modeling.md#spatial-conventions The right-hand side is a weighted displacement in millimetres and the residual is normalised to millimetres; the function converts nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping solvePortraitSkinSystem is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels solvePortraitSkinSystem defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry solvePortraitSkinSystem decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries solvePortraitSkinSystem constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation solvePortraitSkinSystem owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source solvePortraitSkinSystem carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range solvePortraitSkinSystem admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority solvePortraitSkinSystem defines no input through which a caller shapes a human form.
 */
export function solvePortraitSkinSystem(
  multiply: (values: number[]) => number[],
  diagonal: number[],
  rhs: number[],
  scale: number,
): number[] {
  const tolerance = 128 * Number.EPSILON * scale;
  const converged = (residual: number[]): boolean =>
    residual.every((value, i) => Math.abs(value) / diagonal[i] <= tolerance);
  const solution = rhs.map(() => 0);
  let residual = [...rhs];
  if (converged(residual)) return solution;
  let direction = residual.map((value, i) => value / diagonal[i]);
  let energy = dot(residual, direction);
  for (let iteration = 0; iteration < 4 * rhs.length; iteration++) {
    const product = multiply(direction);
    const step = energy / dot(direction, product);
    if (!(step > 0 && Number.isFinite(step)))
      throw new Error(
        "Skin attachment displacement has a numerical breakdown.",
      );
    for (let i = 0; i < solution.length; i++) {
      solution[i] += step * direction[i];
      residual[i] -= step * product[i];
    }
    const restart = converged(residual) || iteration + 1 === 4 * rhs.length;
    if (restart) {
      const actual = multiply(solution);
      residual = rhs.map((value, i) => value - actual[i]);
      if (converged(residual)) return solution;
    }
    const preconditioned = residual.map((value, i) => value / diagonal[i]);
    const nextEnergy = dot(residual, preconditioned);
    const beta = nextEnergy / energy;
    direction = preconditioned.map(
      (value, i) => value + (restart ? 0 : beta * direction[i]),
    );
    energy = nextEnergy;
  }
  throw new Error("Skin attachment displacement did not converge.");
}

/** Euclidean inner product; arrays share the admitted free-vertex ordering. */
function dot(left: number[], right: number[]): number {
  return left.reduce((sum, value, i) => sum + value * right[i], 0);
}

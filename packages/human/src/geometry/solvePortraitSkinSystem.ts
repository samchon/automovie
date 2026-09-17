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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Solves one shared skin displacement axis without part-order ownership or partial caller mutation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Verifies the positive-weight Dirichlet residual and refuses numerical breakdown or exhausted convergence.
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

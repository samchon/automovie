/**
 * Jacobi-preconditioned conjugate gradients on the sparse Dirichlet matrix.
 * The recurrence follows Saad, Iterative Methods for Sparse Linear Systems,
 * second edition, section 9.2, Algorithm 9.1:
 * https://www-users.cse.umn.edu/~saad/IterMethBook_2ndEd.pdf
 *
 * A row-normalized residual has displacement units (mm). The tolerance is
 * 128 floating-point epsilons times the boundary scale, with a 1 mm floor.
 * It measures equation satisfaction, not a universal forward-error bound:
 * nearly singular geometry can amplify residuals. No independent displacement
 * error bound is established here. Recompute b-Ax before accepting convergence;
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
 * @evidence contracts/common.md#principled-implementation Jacobi-preconditioned CG solves the caller's positive Dirichlet operator, recomputing the true residual before acceptance and restarting after recursive residual drift; positive diagonal, matching ordering and scale remain caller premises.
 * @evidence contracts/common.md#clear-and-simple-design This scalar-axis numerical owner accepts matrix multiplication rather than rebuilding mesh connectivity; blendPortraitSkin owns exact pins, free rows and the three independent XYZ right-hand sides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A 4n iteration budget bounds floating conjugacy loss and exhaustion refuses; 128-epsilon row-normalized residual tolerance with caller scale is equation satisfaction, not general forward-error, clinical or visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetre RHS meaning, SPD/diagonal premises, residual/restart rules, iteration bound, owned output and derivative consequences.
 * @evidence contracts/performance.md#efficient-algorithms For n free entries and M multiply cost, at most 4n iterations perform O(M+n) work with O(n) vectors; Jacobi scales the existing diagonal without a dense matrix or mesh reconstruction.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's matrix/diagonal are reused at every recurrence; true residual multiplies are necessary to validate recursive convergence, and independent RHS solves do not share an effectful multiplication result by similar values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Solution/residual/direction/product vectors are call-local and bounded by n; only a converged owned solution escapes, while breakdown/exhaustion changes no input arrays or caller mesh.
 */
export function solvePortraitSkinSystem(
  multiply: (values: number[]) => number[],
  diagonal: number[],
  rhs: number[],
  scale: number,
): number[] {
  const tolerance: number = 128 * Number.EPSILON * scale;
  const converged: (residual: number[]) => boolean = (residual: number[]): boolean =>
    residual.every((value: number, i: number): boolean  => Math.abs(value) / diagonal[i] <= tolerance);
  const solution: number[] = rhs.map((): number  => 0);
  let residual: number[] = [...rhs];
  if (converged(residual)) return solution;
  let direction: number[] = residual.map((value: number, i: number): number  => value / diagonal[i]);
  let energy: number = dot(residual, direction);
  for (let iteration: number = 0; iteration < 4 * rhs.length; iteration++) {
    const product: number[] = multiply(direction);
    const step: number = energy / dot(direction, product);
    if (!(step > 0 && Number.isFinite(step)))
      throw new Error(
        "Skin attachment displacement has a numerical breakdown.",
      );
    for (let i: number = 0; i < solution.length; i++) {
      solution[i] += step * direction[i];
      residual[i] -= step * product[i];
    }
    const restart: boolean = converged(residual) || iteration + 1 === 4 * rhs.length;
    if (restart) {
      const actual: number[] = multiply(solution);
      residual = rhs.map((value: number, i: number): number  => value - actual[i]);
      if (converged(residual)) return solution;
    }
    const preconditioned: number[] = residual.map((value: number, i: number): number  => value / diagonal[i]);
    const nextEnergy: number = dot(residual, preconditioned);
    const beta: number = nextEnergy / energy;
    direction = preconditioned.map(
      (value: number, i: number): number  => value + (restart ? 0 : beta * direction[i]),
    );
    energy = nextEnergy;
  }
  throw new Error("Skin attachment displacement did not converge.");
}

/** Euclidean inner product; arrays share the admitted free-vertex ordering. */
function dot(left: number[], right: number[]): number {
  return left.reduce((sum: number, value: number, i: number): number  => sum + value * right[i], 0);
}

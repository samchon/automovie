import { ISubdivisionRing } from "./ISubdivisionRing";
import { stepSubdivisionRing } from "./stepSubdivisionRing";

/**
 * The limit point and two tangent vectors of a ring's vertex, from the
 * dominant left eigenvectors of the ring's own subdivision matrix.
 *
 * Refining a one-ring is linear in its points, so it is a square matrix `S`
 * over the centre, edge neighbours and diagonals, built here by refining one
 * unit ring per point with `stepSubdivisionRing`. Because the rules are affine,
 * `S` keeps constants, so its dominant eigenvalue is 1 and the matching left
 * eigenvector, scaled to sum 1, is the limit-position mask; the two dominant
 * left eigenvectors among the masks that sum to zero span the tangent masks
 * (Halstead, Kass and DeRose 1993 derive the smooth case in closed form). Both
 * are found by iteration on `S` from the left: plain power iteration for the
 * limit, and orthogonal iteration of a two-dimensional zero-sum subspace for
 * the tangents, re-orthonormalised every step so the weaker tangent is never
 * lost to the stronger one. `limitSubdivisionRing` uses this for darts and
 * for crease sides of three faces, whose sharp edges give them other matrices
 * than the published masks assume. The tangent search converges at the ratio
 * of the third to the second dominant zero-sum eigenvalue, about 0.94 for a
 * dart of valence 12, so `EIGEN_STEPS` iterations reach rounding.
 *
 * @param ring A one-ring whose sharpness is only 0 or 10.
 * @returns The limit point and two vectors spanning the tangent plane, unoriented.
 *
 * @evidence contracts/common.md#principled-implementation The limit and tangent masks of a stationary subdivision scheme are the dominant left eigenvectors of its local subdivision matrix; power iteration and orthogonal (subspace) iteration are the standard methods for a few dominant eigenvectors of a small non-symmetric matrix, and projecting onto zero-sum masks removes the eigenvalue-1 direction exactly because `S` maps constants to constants. The precondition is that the two tangent eigenvalues dominate the rest, which is what tangent-plane continuity at the vertex means; where the scheme is not tangent-plane continuous there is no limit normal to find.
 * @evidence contracts/common.md#clear-and-simple-design The matrix is derived from `stepSubdivisionRing`, so it cannot drift from the rules actually applied; the masks it yields are applied here, and orientation stays with the caller, which knows the sector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The iteration count is fixed rather than a tolerance loop, so every host performs the same arithmetic.
 * @evidence contracts/common.md#meaningful-documentation States the matrix, why its eigenvectors are the masks, both iterations and the re-orthonormalisation, which classes use it, the convergence rate and the precondition.
 * @evidence contracts/performance.md#efficient-algorithms For ring size `d` (one plus edges plus diagonals), building `S` costs `d` ring steps of `O(d)`, and each of `EIGEN_STEPS` iterations costs `O(d^2)` for three vectors; it runs only for darts and three-face crease sides.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each ring's matrix depends on its own valence and sharpness and is used once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds one `d` by `d` matrix and three length-`d` vectors, released on return.
 */
export const subdivisionRingEigenbasis = (
  ring: ISubdivisionRing,
): { limit: number[]; tangents: number[][] } => {
  const points: number[] = [...ring.centre, ...ring.edges, ...ring.diagonals];
  const size: number = points.length / 3;
  const matrix: number[][] = [];
  for (let j: number = 0; j < size; ++j) {
    const unit: number[] = new Array<number>(size * 3).fill(0);
    unit[j * 3] = 1;
    const refined: ISubdivisionRing = stepSubdivisionRing({
      centre: unit.slice(0, 3),
      edges: unit.slice(3, 3 + ring.edges.length),
      diagonals: unit.slice(3 + ring.edges.length),
      sharpness: ring.sharpness,
    });
    const column: number[] = [
      ...refined.centre,
      ...refined.edges,
      ...refined.diagonals,
    ];
    for (let i: number = 0; i < size; ++i) (matrix[i] ??= [])[j] = column[i * 3]!;
  }
  const times: (w: readonly number[]) => number[] = (
    w: readonly number[],
  ): number[] => {
    const out: number[] = new Array<number>(size).fill(0);
    for (let i: number = 0; i < size; ++i)
      for (let j: number = 0; j < size; ++j) out[j]! += w[i]! * matrix[i]![j]!;
    return out;
  };

  let limit: number[] = new Array<number>(size).fill(0);
  limit[0] = 1;
  let first: number[] = new Array<number>(size).fill(0);
  let second: number[] = new Array<number>(size).fill(0);
  first[0] = -1;
  first[1] = 1;
  second[0] = -1;
  second[size - 1] = 1;
  for (let step: number = 0; step < EIGEN_STEPS; ++step) {
    limit = times(limit);
    first = normalise(zeroSum(times(first)));
    second = zeroSum(times(second));
    const along: number = dot(second, first);
    second = normalise(second.map((x: number, i: number): number => x - along * first[i]!));
  }
  const apply: (w: readonly number[]) => number[] = (
    w: readonly number[],
  ): number[] =>
    [0, 1, 2].map((axis: number): number =>
      w.reduce((sum: number, x: number, i: number): number => sum + x * points[i * 3 + axis]!, 0),
    );
  return { limit: apply(limit), tangents: [apply(first), apply(second)] };
};

/** Iterations of both eigenvector searches. */
const EIGEN_STEPS: number = 512;

/** The mask minus its mean, so its weights sum to zero. */
const zeroSum: (w: readonly number[]) => number[] = (
  w: readonly number[],
): number[] => {
  const mean: number = w.reduce((a: number, b: number): number => a + b, 0) / w.length;
  return w.map((x: number): number => x - mean);
};

/** The dot product of two masks. */
const dot: (a: readonly number[], b: readonly number[]) => number = (
  a: readonly number[],
  b: readonly number[],
): number =>
  a.reduce((sum: number, x: number, i: number): number => sum + x * b[i]!, 0);

/** The mask scaled to unit Euclidean length. */
const normalise: (w: readonly number[]) => number[] = (
  w: readonly number[],
): number[] => {
  const size: number = Math.sqrt(dot(w, w));
  return w.map((x: number): number => x / size);
};

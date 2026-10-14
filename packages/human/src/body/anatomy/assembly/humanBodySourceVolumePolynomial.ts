import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Derive the four cubic-metre coefficients of one linear source field's enclosed volume.
 *
 * The caller first admits finite closed outward-oriented indexed topology and a native-aligned finite displacement field. Determinant multilinearity expands each tetrahedron's three moving edges into powers of the dimensionless coefficient. The first indexed vertex supplies a shared moving origin to reduce cancellation under world translation; each coefficient uses compensated summation. Inputs stay unchanged and nonfinite accumulated coefficients throw. The polynomial alone certifies neither intermediate embeddedness nor clinical anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Multilinearity of the signed tetrahedral determinant gives an exact cubic representation for linear vertex displacements; admitted indexed topology and aligned finite fields supply the representation's premises, with floating-point accumulation limits stated.
 * @evidence contracts/common.md#clear-and-simple-design One coefficient owner isolates the volume expansion from target admission and bisection in dataSourceShapes, which consumes all four returned coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A shared moving origin and compensated sums address translation cancellation without fitting coefficients to sampled outputs, capping invalid boundaries or introducing consumer-specific geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment states cubic-metre units, dimensionless input coefficient, topology/field premises, moving-origin semantics, refusal and the limits of polynomial validation.
 * @evidence contracts/performance.md#efficient-algorithms One pass over T triangles computes four fixed-size determinant expansions in O(T) time with constant auxiliary storage; actual source positions and field arrays are read without mesh clones.
 * @evidence contracts/performance.md#reuse-equivalent-work The target solver reuses the returned four coefficients across derivative checks and bisection rather than rebuilding and measuring boundary meshes at every candidate coefficient.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Triangle vectors and compensation terms are call-local; only four scalar coefficients escape and no source mesh, field cache or external handle is retained.
 */
export function humanBodySourceVolumePolynomial(
  mesh: IAutoMovieMesh,
  delta: readonly number[],
): [number, number, number, number] {
  const indices: number[] = mesh.indices!;
  const origin: number = indices[0];
  const determinant: (
    a: readonly number[],
    b: readonly number[],
    c: readonly number[],
  ) => number = (
    a: readonly number[],
    b: readonly number[],
    c: readonly number[],
  ): number =>
    a[0] * (b[1] * c[2] - b[2] * c[1]) +
    a[1] * (b[2] * c[0] - b[0] * c[2]) +
    a[2] * (b[0] * c[1] - b[1] * c[0]);
  const coefficients: [number, number, number, number] = [0, 0, 0, 0];
  const corrections: number[] = [0, 0, 0, 0];
  for (let at: number = 0; at < indices.length; at += 3) {
    const vertices: number[] = indices.slice(at, at + 3);
    const [a, b, c]: number[][] = vertices.map((vertex: number): number[] =>
      [0, 1, 2].map(
        (axis: number): number =>
          mesh.positions[3 * vertex + axis] - mesh.positions[3 * origin + axis],
      ),
    );
    const [da, db, dc]: number[][] = vertices.map((vertex: number): number[] =>
      [0, 1, 2].map(
        (axis: number): number =>
          delta[3 * vertex + axis] - delta[3 * origin + axis],
      ),
    );
    const terms: number[] = [
      determinant(a, b, c),
      determinant(da, b, c) + determinant(a, db, c) + determinant(a, b, dc),
      determinant(da, db, c) + determinant(da, b, dc) + determinant(a, db, dc),
      determinant(da, db, dc),
    ];
    for (let degree: number = 0; degree < 4; degree++) {
      const adjusted: number = terms[degree] / 6 - corrections[degree];
      const next: number = coefficients[degree] + adjusted;
      corrections[degree] = next - coefficients[degree] - adjusted;
      coefficients[degree] = next;
    }
  }
  if (!coefficients.every(Number.isFinite))
    throw new Error("Source boundary-volume polynomial is not finite.");
  return coefficients;
}

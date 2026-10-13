/**
 * Admit every emitted triangle of a deformed mesh by area and orientation.
 *
 * For each triangle of `indices`, the source and deformed area vectors over
 * the same three vertices must be finite and nonzero. The source unit normal
 * is transported through each corner's cofactor matrix (row-major, nine
 * entries per vertex) and must stay finite and nonzero there, its direction
 * kept by rescaling when only its norm overflows; the deformed normal must
 * agree positively with the sum of the three unit transported normals. Positions are flat XYZ in one frame. A failure throws and names the
 * triangle ordinal, and for a transport failure the vertex; inputs are read
 * only. Every index must address a vertex of all four arrays, which
 * `createAutoMovieMeshDeformer` checks before calling.
 *
 * Compare a straight output face with the differential orientation of its
 * source face. Cofactors are det(J) * inverse(J)-transpose, so their positive
 * scalar does not alter orientation. Normalizing each transported face normal
 * before summation gives every corner equal weight, independent of local area
 * stretch. Comparing old and new area vectors directly would incorrectly
 * refuse an orientation-preserving bend that turns the face through 90 degrees.
 *
 * Cross products have square-metre units; normalized orientation is unitless.
 * No absolute area epsilon excludes a small but representable triangle. A
 * collapsed or opposing sampled face needs finer tessellation or a different
 * field, even when all of its endpoint Jacobians remain positive.
 *
 * @evidence contracts/common.md#principled-implementation Area vectors are edge cross products and the cofactor matrix is the transformation that carries oriented area under the Jacobian, so the summed unit transports give the orientation the smooth field assigns the face; a positive dot product with the straight output face's unit normal is the admission, a transport whose norm alone overflows is rescaled by its largest component so that corner keeps its equal weight, and a non-finite or zero transport is refused by its own diagnostic rather than read as an opposed face.
 * @evidence contracts/common.md#clear-and-simple-design One assertion called once by `createAutoMovieMeshDeformer` after every vertex has its position and cofactor, so the per-vertex Jacobian work stays in the deformer and the per-triangle tessellation check stays here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No triangle is skipped for being small, collapsed or reversed and no area floor admits a near-zero face; every face of every mesh meets the same transported-orientation test.
 * @evidence contracts/common.md#meaningful-documentation States what is compared and in which layout, every refusal and what it names, the index premise and who establishes it, why transported rather than source normals are compared, the units, and that no area epsilon exists.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the t triangles with constant work each, three corner transports included, so O(t) time; the scalar locals and two three-element scratch buffers allocated once per call keep the loop free of per-triangle allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validates one deformed mesh per call; nothing in a later deformation repeats this mesh's cofactors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds two three-element scratch buffers for the call and retains nothing after it returns or throws.
 * @author Samchon
 */
export function assertAutoMovieDeformedTriangles(
  source: readonly number[],
  target: readonly number[],
  indices: readonly number[],
  cofactors: readonly (readonly number[])[],
): void {
  const before: Float64Array = new Float64Array(3);
  const after: Float64Array = new Float64Array(3);
  for (let corner: number = 0; corner < indices.length; corner += 3) {
    const triangle: number = corner / 3;
    const a: number = indices[corner]!;
    const b: number = indices[corner + 1]!;
    const c: number = indices[corner + 2]!;
    writeAreaVector(source, a, b, c, before);
    writeAreaVector(target, a, b, c, after);
    const beforeLength: number = Math.hypot(before[0]!, before[1]!, before[2]!);
    const afterLength: number = Math.hypot(after[0]!, after[1]!, after[2]!);
    if (
      !Number.isFinite(beforeLength) ||
      beforeLength === 0 ||
      !Number.isFinite(afterLength) ||
      afterLength === 0
    )
      throw new Error(
        `Mesh deformation triangle ${triangle} needs finite nonzero source and output area.`,
      );
    const nx: number = before[0]! / beforeLength;
    const ny: number = before[1]! / beforeLength;
    const nz: number = before[2]! / beforeLength;
    let ex: number = 0;
    let ey: number = 0;
    let ez: number = 0;
    for (let offset: number = 0; offset < 3; ++offset) {
      const vertex: number = indices[corner + offset]!;
      const matrix: readonly number[] = cofactors[vertex]!;
      let tx: number = matrix[0]! * nx + matrix[1]! * ny + matrix[2]! * nz;
      let ty: number = matrix[3]! * nx + matrix[4]! * ny + matrix[5]! * nz;
      let tz: number = matrix[6]! * nx + matrix[7]! * ny + matrix[8]! * nz;
      if (!Number.isFinite(tx) || !Number.isFinite(ty) || !Number.isFinite(tz))
        throw new Error(
          `Mesh deformation triangle ${triangle} cannot transport its source orientation through vertex ${vertex}.`,
        );
      let length: number = Math.hypot(tx, ty, tz);
      if (length === Infinity) {
        // Finite components whose norm overflows still carry a direction;
        // dividing by the largest one keeps that corner's equal weight.
        const scale: number = Math.max(Math.abs(tx), Math.abs(ty), Math.abs(tz));
        tx /= scale;
        ty /= scale;
        tz /= scale;
        length = Math.hypot(tx, ty, tz);
      }
      if (!(length > 0))
        throw new Error(
          `Mesh deformation triangle ${triangle} cannot transport its source orientation through vertex ${vertex}.`,
        );
      ex += tx / length;
      ey += ty / length;
      ez += tz / length;
    }
    const agreement: number =
      (after[0]! / afterLength) * ex +
      (after[1]! / afterLength) * ey +
      (after[2]! / afterLength) * ez;
    if (!(agreement > 0))
      throw new Error(
        `Mesh deformation triangle ${triangle} opposes its transported surface orientation.`,
      );
  }
}

/**
 * Write the area vector `(b - a) x (c - a)` of three flat-XYZ vertices into
 * `out`, in square metres; its length is twice the triangle's area.
 */
const writeAreaVector = (
  positions: readonly number[],
  a: number,
  b: number,
  c: number,
  out: Float64Array,
): void => {
  const ux: number = positions[3 * b]! - positions[3 * a]!;
  const uy: number = positions[3 * b + 1]! - positions[3 * a + 1]!;
  const uz: number = positions[3 * b + 2]! - positions[3 * a + 2]!;
  const vx: number = positions[3 * c]! - positions[3 * a]!;
  const vy: number = positions[3 * c + 1]! - positions[3 * a + 1]!;
  const vz: number = positions[3 * c + 2]! - positions[3 * a + 2]!;
  out[0] = uy * vz - uz * vy;
  out[1] = uz * vx - ux * vz;
  out[2] = ux * vy - uy * vx;
};

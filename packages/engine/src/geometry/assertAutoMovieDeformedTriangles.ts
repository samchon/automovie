/**
 * Admit every emitted triangle of a deformed mesh by area and orientation.
 *
 * For each triangle of `indices`, the source and deformed area vectors over
 * the same three vertices must be finite and nonzero. The source unit normal
 * is transported through each corner's cofactor matrix (row-major, nine
 * entries per vertex); the deformed normal must agree positively with the sum
 * of the three unit transported normals. Positions are flat XYZ in one frame.
 * A failure throws and names the triangle ordinal; inputs are read only.
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
 * @evidence requirements/asset-authoring/geometry.md#asset-degenerate-geometry-refusal Refuses deformation output whose triangle area collapses or opposes its transported face orientation.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures Checks the actual emitted triangle population, naming the triangle that cannot preserve an orientation.
 * @author Samchon
 */
export function assertAutoMovieDeformedTriangles(
  source: readonly number[],
  target: readonly number[],
  indices: readonly number[],
  cofactors: readonly (readonly number[])[],
): void {
  const area = (
    positions: readonly number[],
    a: number,
    b: number,
    c: number,
  ) => {
    const ux = positions[3 * b] - positions[3 * a];
    const uy = positions[3 * b + 1] - positions[3 * a + 1];
    const uz = positions[3 * b + 2] - positions[3 * a + 2];
    const vx = positions[3 * c] - positions[3 * a];
    const vy = positions[3 * c + 1] - positions[3 * a + 1];
    const vz = positions[3 * c + 2] - positions[3 * a + 2];
    return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  };
  for (let triangle = 0; triangle < indices.length; triangle += 3) {
    const vertices = indices.slice(triangle, triangle + 3);
    const before = area(source, vertices[0], vertices[1], vertices[2]);
    const after = area(target, vertices[0], vertices[1], vertices[2]);
    const beforeLength = Math.hypot(...before);
    const afterLength = Math.hypot(...after);
    if (
      !Number.isFinite(beforeLength) ||
      beforeLength === 0 ||
      !Number.isFinite(afterLength) ||
      afterLength === 0
    )
      throw new Error(
        `Mesh deformation triangle ${triangle / 3} needs finite nonzero source and output area.`,
      );
    const expected = [0, 0, 0];
    const normal = before.map((value) => value / beforeLength);
    for (const vertex of vertices) {
      const matrix = cofactors[vertex];
      const transported = [0, 1, 2].map(
        (row) =>
          matrix[3 * row] * normal[0] +
          matrix[3 * row + 1] * normal[1] +
          matrix[3 * row + 2] * normal[2],
      );
      const length = Math.hypot(...transported);
      for (let axis = 0; axis < 3; axis++)
        expected[axis] += transported[axis] / length;
    }
    const agreement = after.reduce(
      (sum, value, axis) => sum + (value / afterLength) * expected[axis],
      0,
    );
    if (!(agreement > 0))
      throw new Error(
        `Mesh deformation triangle ${triangle / 3} opposes its transported surface orientation.`,
      );
  }
}

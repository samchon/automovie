import { blendPortraitSkin } from "@automovie/human/geometry/blendPortraitSkin";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Long connected skin must solve the same harmonic problem as a small patch.
 * A cylinder has four equal vertices per ring and symmetric axial neighbours.
 * Its exact displacement is the axial fraction between the fixed end rings:
 * circumferential contributions cancel and the two axial slopes cancel.
 * The oracle follows that symmetry, independently of any iterative solver.
 *
 * Scenarios:
 * 1. Pin a 101-ring cylinder to zero and [1, -2, 3] mm end displacements;
 *    every free vertex must agree with the linear field within 1e-8 mm.
 * 2. Reverse the pin order and reproduce the same result without mutating
 *    the caller's vertices, triangles or requested attachment targets.
 */
export const test_subject_skin_harmonic_convergence = (): void => {
  const positions: number[][] = [];
  const indices: number[] = [];
  const corners = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  const rings = 101;
  for (let ring = 0; ring < rings; ring++)
    for (const [x, z] of corners) positions.push([x, ring, z]);
  for (let ring = 0; ring < rings - 1; ring++)
    for (let corner = 0; corner < 4; corner++) {
      const a = ring * 4 + corner;
      const b = ring * 4 + ((corner + 1) % 4);
      indices.push(a, b, a + 4, b, b + 4, a + 4);
    }
  const shift = [1, -2, 3];
  const pins = [0, rings - 1].flatMap((ring) =>
    corners.map((_, corner) => {
      const vertex = ring * 4 + corner;
      return {
        vertex,
        target: positions[vertex].map(
          (value, axis) => value + (shift[axis] * ring) / (rings - 1),
        ),
        reach: rings + 3,
      };
    }),
  );
  const original = structuredClone({ positions, indices, pins });
  const result = blendPortraitSkin(positions, indices, pins);
  TestValidator.predicate(
    "long cylinder reaches the analytic harmonic field",
    result.every((point, vertex) =>
      point.every((value, axis) =>
        nclose(
          value - positions[vertex][axis],
          (shift[axis] * Math.floor(vertex / 4)) / (rings - 1),
          1e-8,
        ),
      ),
    ),
  );
  TestValidator.equals(
    "harmonic solve preserves all caller inputs",
    { positions, indices, pins },
    original,
  );
  TestValidator.equals(
    "long harmonic solve is independent of pin order",
    blendPortraitSkin(positions, indices, [...pins].reverse()),
    result,
  );
};

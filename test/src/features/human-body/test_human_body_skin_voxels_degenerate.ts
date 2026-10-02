import { TestValidator } from "@nestia/e2e";

import {
  censusSkinVoxelSigns,
  createVoxelTetrahedron,
  isInsideConvexSolid,
} from "../internal/humanBodySkinVoxelFixture";

/**
 * A triangle without area has no normal, so it adds no sample, no edge
 * normal and no vertex angle, and a solid that carries one beside its faces
 * reads as the solid alone. The oracle is the analytic inside test of the
 * convex tetrahedron.
 *
 * The two degenerate triangles share an edge of the solid inside the grid: one
 * repeats a corner (a sliver collapsed to a segment) and one lays a third
 * corner on the edge's midpoint (a collinear triple), the two ways a
 * subdivided skin loses a triangle's area.
 *
 * Scenarios:
 * 1. With both degenerate triangles added, the shell refuses no air voxel and
 *    admits no flesh voxel, and holds air voxels.
 * 2. The shell holds the same voxels as the solid alone: the degenerate
 *    triangles change no ball centre.
 */
export const test_human_body_skin_voxels_degenerate = (): void => {
  const solid = createVoxelTetrahedron();
  const rho = 0.02;
  const cell = 0.008;
  const midpoint = [0.02, 0, 0];
  const withExtra = (corner: number[]) => ({
    positions: [...solid.positions, ...corner],
    indices: [...solid.indices, 1, 2, 2, 1, 2, 4],
  });
  const judge = (skin: typeof solid) =>
    censusSkinVoxelSigns({
      skin: [skin],
      points: [0, 0, 0],
      rho,
      cell,
      air: (at) => !isInsideConvexSolid(solid, at),
    });

  // 1. collapsed and collinear triangles
  const census = judge(withExtra(midpoint));
  TestValidator.predicate("the shell holds air voxels", census.air > 100);
  TestValidator.equals("no air voxel is refused", census.airRefused, 0);
  TestValidator.equals("no flesh voxel is admitted", census.fleshAdmitted, 0);

  // 2. identical to the solid alone
  const alone = judge(solid);
  TestValidator.equals("the shell is the solid's own", census.shell, alone.shell);
};

import { TestValidator } from "@nestia/e2e";

import {
  censusSkinVoxelSigns,
  createVoxelCube,
  isInsideConvexSolid,
  reverseVoxelSolid,
  rotateVoxelSolid,
} from "../internal/humanBodySkinVoxelFixture";

/**
 * The winding decides which side is air. A cube wound outward has air outside
 * and flesh inside, and the same cube wound inward has them the other way
 * round, so the sign is read from the triangles' orientation and never from
 * where the solid happens to lie. The oracle is the analytic inside test of a
 * convex solid, independent of the voxeliser.
 *
 * The grid is centred on a corner of the cube so the shell holds voxels on
 * both sides of three faces and across three edges and a vertex.
 *
 * Scenarios:
 * 1. Outward winding refuses no air voxel and admits no flesh voxel of the
 *    shell, and the shell holds voxels of both kinds.
 * 2. Inward winding refuses no voxel the oracle calls flesh and admits none
 *    it calls air: the two answers are exchanged.
 * 3. The cube turned by a fixed rotation, so its faces meet the grid
 *    obliquely, reads the same way in both windings.
 */
export const test_human_body_skin_voxels_cube_winding = (): void => {
  const rho = 0.02;
  const cell = 0.008;
  const check = (title: string, outward: boolean, turn: boolean): void => {
    let solid = createVoxelCube(0.04);
    if (turn) solid = rotateVoxelSolid(solid, [0.31, -0.52, 0.4, 0.69]);
    const corner = turn
      ? rotateVoxelSolid(
          { positions: [0.04, 0.04, 0.04], indices: [] },
          [0.31, -0.52, 0.4, 0.69],
        ).positions
      : [0.04, 0.04, 0.04];
    const inside = (at: readonly number[]): boolean =>
      isInsideConvexSolid(solid, at);
    const census = censusSkinVoxelSigns({
      skin: [outward ? solid : reverseVoxelSolid(solid)],
      points: corner,
      rho,
      cell,
      air: (at) => (outward ? !inside(at) : inside(at)),
    });
    TestValidator.predicate(title + ": the shell holds air and flesh voxels", census.air > 20 && census.flesh > 20);
    TestValidator.equals(title + ": no air voxel is refused", census.airRefused, 0);
    TestValidator.equals(
      title + ": no flesh voxel is admitted",
      census.fleshAdmitted,
      0,
    );
  };
  check("outward cube", true, false);
  check("inward cube", false, false);
  check("turned outward cube", true, true);
  check("turned inward cube", false, true);
};

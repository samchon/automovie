import { voxelizeHumanBodySkin } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  censusSkinVoxelSigns,
  createVoxelTetrahedron,
  isInsideConvexSolid,
  rotateVoxelSolid,
} from "../internal/humanBodySkinVoxelFixture";

/**
 * A closed convex solid reads as air everywhere outside it and as flesh
 * everywhere inside it, however its faces meet at the edges. The oracle is
 * the analytic inside test of a convex solid (behind every face plane), which
 * shares no normal, sample or distance with the voxeliser. A tetrahedron has
 * acute edges, where the faces on either side tilt away from a point above the
 * edge, so a sign that sums or blends the normals of several features
 * misreads exactly there.
 *
 * Scenarios:
 * 1. Above the flat +Z face of the tetrahedron the voxel over a point a ball
 *    of 20 mm could rest on is in the distance shell, above the face by
 *    construction, and is admitted as a ball centre.
 * 2. Over the whole centre shell around the origin, with cells of 8 mm, the
 *    tetrahedron refuses no voxel the oracle calls air and admits none it
 *    calls flesh, as built and turned by three fixed rotations that move its
 *    edges across the grid. The shell is not empty in any arrangement.
 */
export const test_human_body_skin_voxels_convex_face = (): void => {
  const tetrahedron = createVoxelTetrahedron();
  const rho = 0.02;
  const cell = 0.008;

  // 1. above the flat face
  const voxels = voxelizeHumanBodySkin({
    skin: [tetrahedron],
    points: [0, 0, 0],
    pad: rho + 2 * cell,
    cell,
  });
  const above = voxels.voxelOf([0.004, 0.004, rho]);
  const squared = voxels.distance.squared[above];
  TestValidator.predicate(
    "the voxel lies above the face and within the distance shell",
    voxels.centre(above)[2] > 0 &&
      squared >= ((rho - cell) / cell) ** 2 &&
      squared < ((rho + 2 * cell) / cell) ** 2,
  );
  TestValidator.equals(
    "an exterior centre above the flat face is admitted",
    voxels.centres(rho)[above],
    1,
  );

  // 2. the whole shell against the analytic inside test
  for (const quaternion of [
    undefined,
    [0.31, -0.52, 0.4, 0.69],
    [-0.2, 0.7, 0.1, 0.65],
    [0.6, 0.2, -0.5, 0.4],
  ] as const) {
    const solid =
      quaternion === undefined
        ? tetrahedron
        : rotateVoxelSolid(tetrahedron, [...quaternion]);
    const census = censusSkinVoxelSigns({
      skin: [solid],
      points: [0, 0, 0],
      rho,
      cell,
      air: (at) => !isInsideConvexSolid(solid, at),
    });
    TestValidator.predicate("the shell holds air voxels", census.air > 100);
    TestValidator.equals("no air voxel is refused", census.airRefused, 0);
    TestValidator.equals("no flesh voxel is admitted", census.fleshAdmitted, 0);
  }
};

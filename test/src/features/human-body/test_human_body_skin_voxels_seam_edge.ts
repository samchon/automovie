import { TestValidator } from "@nestia/e2e";

import {
  censusSkinVoxelSigns,
  createVoxelTetrahedron,
  isInsideConvexSolid,
  rotateVoxelSolid,
} from "../internal/humanBodySkinVoxelFixture";

/**
 * An edge is shared by the faces that meet there, however the vertex indices
 * name its ends. A skin splits its vertices along a material or UV seam, so a
 * face may reach the edge through its own copies of the corners, and the edge
 * is open only where one triangle has it. The oracle is the analytic inside
 * test of a convex solid, and the claim is that a tetrahedron whose every face
 * owns three private vertices reads exactly as the one whose faces share
 * four.
 *
 * Scenarios:
 * 1. The flat-shaded tetrahedron, twelve vertices and no shared index, refuses
 *    no air voxel and admits no flesh voxel of the shell, as built and turned
 *    by two fixed rotations.
 * 2. The same tetrahedron with one face's vertices moved apart by a
 *    millimetre is no longer one solid: its three edges are open, and the
 *    shell it leaves differs from the closed one, so the first scenario
 *    measures the welding and not an arrangement that is insensitive to it.
 */
export const test_human_body_skin_voxels_seam_edge = (): void => {
  const shared = createVoxelTetrahedron();
  const split = (offset: number) => {
    const positions: number[] = [];
    const indices: number[] = [];
    for (let t = 0; t < shared.indices.length; t += 3)
      for (let k = 0; k < 3; k++) {
        const at = shared.indices[t + k] * 3;
        // the face of the tetrahedron the offset moves is the first
        positions.push(
          shared.positions[at] + (t === 0 ? offset : 0),
          shared.positions[at + 1],
          shared.positions[at + 2],
        );
        indices.push(positions.length / 3 - 1);
      }
    return { positions, indices };
  };
  const rho = 0.02;
  const cell = 0.008;
  const judge = (solid: typeof shared, flat: typeof shared) =>
    censusSkinVoxelSigns({
      skin: [flat],
      points: [0, 0, 0],
      rho,
      cell,
      air: (at) => !isInsideConvexSolid(solid, at),
    });

  // 1. private vertices, welded by position
  for (const turn of [undefined, [0.31, -0.52, 0.4, 0.69]] as const) {
    const solid =
      turn === undefined ? shared : rotateVoxelSolid(shared, [...turn]);
    const flat =
      turn === undefined ? split(0) : rotateVoxelSolid(split(0), [...turn]);
    const census = judge(solid, flat);
    TestValidator.predicate("the shell holds air voxels", census.air > 100);
    TestValidator.equals("no air voxel is refused", census.airRefused, 0);
    TestValidator.equals("no flesh voxel is admitted", census.fleshAdmitted, 0);
  }

  // 2. a face moved off its neighbours is open
  const opened = judge(shared, split(0.001));
  TestValidator.predicate(
    "an unwelded face leaves air voxels the closed solid does not",
    opened.airRefused + opened.fleshAdmitted > 0,
  );
};

import { voxelizeHumanBodySkin } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The skin voxelised around points answers the distance to the skin, the
 * nearest skin sample, the voxel of a point and the centres a ball could rest
 * on, and tells the air from the flesh.
 *
 * The skin is one 1 m triangle in the plane y = 0 wound to face +Y (cross of
 * its first two edges is +Y), a flat sheet whose pseudo-normal is +Y
 * everywhere and whose distance from a voxel is the hand-counted number of
 * cells to the plane.
 *
 * Scenarios:
 * 1. Around the point (0, 0.01, 0) with pad 0.03 and cells of 5 mm, the
 *    grid starts at y = -0.02 and the plane is voxel row 4: the voxel of
 *    (0, 0.03, 0) is six cells above it, squared distance 36, and the
 *    voxel of a plane point is at distance zero.
 * 2. Centres for a ball of 0.02 lie in the rows whose squared distance is in
 *    [9, 36) and only above the plane: row 8 is a centre, row 5 (too close),
 *    row 10 (beyond the shell) and row 0 (four cells below the plane, in
 *    the flesh side) are not.
 * 3. The nearest sample of an off-grid-point above the plane is on the plane,
 *    within the sampling spacing of the point's projection; the centre of a
 *    voxel is the voxel of that centre; a point far outside the grid clamps
 *    to the first or last voxel.
 * 4. A grid of more than sixteen million voxels is refused.
 * 5. A dense sampling (cells of 2 mm over 0.34 x 0.24 m) grows the sample
 *    buffers past their first size and still finds the plane at distance zero.
 * 6. Triangles that miss the grid or have no area add no sample: a
 *    degenerate triangle and a triangle far above the grid leave the
 *    distances of scenario 1 unchanged.
 */
export const test_human_body_skin_voxels = (): void => {
  const plane = {
    positions: [-0.5, 0, -0.5, 0, 0, 0.5, 0.5, 0, -0.5],
    indices: [0, 1, 2],
  };
  const around = (skin: (typeof plane)[], points: number[], cell = 0.005, pad = 0.03) =>
    voxelizeHumanBodySkin({ skin, points, pad, cell });

  // 1. distances
  const voxels = around([plane], [0, 0.01, 0]);
  const [nx, ny] = voxels.dimensions;
  const voxel = (x: number, y: number, z: number) => voxels.voxelOf([x, y, z]);
  const row = (v: number) => Math.floor(v / nx) % ny;
  TestValidator.equals("the plane is row 4", row(voxel(0, 0, 0)), 4);
  TestValidator.equals("six cells above the plane", voxels.distance.squared[voxel(0, 0.03, 0)], 36);
  TestValidator.equals("a plane voxel is at distance zero", voxels.distance.squared[voxel(0, 0, 0)], 0);

  // 2. centres
  const centres = voxels.centres(0.02);
  TestValidator.equals("row 8 is a centre", centres[voxel(0, 0.02, 0)], 1);
  TestValidator.equals("a voxel too close is not", centres[voxel(0, 0.005, 0)], 0);
  TestValidator.equals("a voxel beyond the shell is not", centres[voxel(0, 0.03, 0)], 0);
  TestValidator.equals("row 0 below the plane is in the flesh side", row(voxel(0, -0.02, 0)), 0);
  TestValidator.equals("a voxel below the plane is not a centre", centres[voxel(0, -0.02, 0)], 0);

  // 3. nearest sample, centre and clamping
  const near = voxels.nearest(voxels.distance.source[voxel(0.0123, 0.03, 0.0077)]!, [0.0123, 0.03, 0.0077]);
  TestValidator.predicate(
    "the nearest sample is on the plane under the point",
    nclose(near[1]!, 0, 1e-12) &&
      nclose(near[0]!, 0.0123, 0.0026) &&
      nclose(near[2]!, 0.0077, 0.0026),
  );
  const at = voxels.centre(voxel(0.0123, 0.03, 0.0077));
  TestValidator.equals("the centre is the voxel of itself", voxels.voxelOf(at), voxel(0.0123, 0.03, 0.0077));
  TestValidator.equals("a point below the grid clamps to the first voxel row", row(voxels.voxelOf([0, -9, 0])), 0);
  TestValidator.equals("a point above the grid clamps to the last voxel row", row(voxels.voxelOf([0, 9, 0])), ny - 1);

  // 4. refusal
  TestValidator.predicate(
    "a grid beyond sixteen million voxels is refused",
    throwsError(() => around([plane], [0, 0, 0, 1.3, 1.3, 1.3], 0.005, 0.03), "too large"),
  );

  // 5. dense sampling
  const dense = around([plane], [-0.17, 0.004, -0.12, 0.17, 0.004, 0.12], 0.002, 0.005);
  TestValidator.equals(
    "a dense skin still finds the plane",
    dense.distance.squared[dense.voxelOf([0, 0, 0])],
    0,
  );

  // 6. triangles that add nothing
  const noisy = around(
    [
      plane,
      { positions: [0, 0, 0, 0.01, 0, 0, 0.02, 0, 0], indices: [0, 1, 2] },
      { positions: [0, 5, 0, 1, 5, 0, 0, 5, 1], indices: [0, 1, 2] },
      { positions: [0, -5, 0, 1, -5, 0, 0, -5, 1], indices: [0, 1, 2] },
    ],
    [0, 0.01, 0],
  );
  TestValidator.equals(
    "a degenerate and two far triangles change nothing",
    noisy.distance.squared[noisy.voxelOf([0, 0.03, 0])],
    36,
  );
};

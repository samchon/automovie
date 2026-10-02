import { TestValidator } from "@nestia/e2e";

import { censusSkinVoxelSigns } from "../internal/humanBodySkinVoxelFixture";

/**
 * An open sheet has a front and no inside, and the voxels read its front as
 * air as far as its reach: above the sheet and beyond its rim alike, because
 * the nearest feature of a point past the rim is the rim, whose single
 * triangle gives it that triangle's normal. The oracle is the half space in
 * front of the sheet's plane, which is what an open skin (a neck, a wrist, a
 * garment's own cut) reaches.
 *
 * The sheet is a 0.1 m square in the plane y = 0 wound to face +Y, two
 * triangles that share a diagonal, and the grid is centred on one corner so
 * the shell holds voxels over the sheet, beyond its sides and past its corner.
 *
 * Scenarios:
 * 1. Every voxel of the centre shell in front of the plane is admitted and
 *    every one behind it is declined. Both kinds exist, and some voxels of
 *    each lie beyond the rim in x or z.
 */
export const test_human_body_skin_voxels_open_sheet = (): void => {
  const sheet = {
    positions: [-0.05, 0, -0.05, -0.05, 0, 0.05, 0.05, 0, -0.05, 0.05, 0, 0.05],
    indices: [0, 1, 2, 1, 3, 2],
  };
  const beyond = { count: 0 };
  const census = censusSkinVoxelSigns({
    skin: [sheet],
    points: [0.05, 0, 0.05],
    rho: 0.02,
    cell: 0.008,
    air: (at) => {
      if (at[0] > 0.05 || at[2] > 0.05) ++beyond.count;
      return at[1] > 0;
    },
  });
  TestValidator.predicate(
    "the shell holds voxels on both sides of the sheet",
    census.air > 50 && census.flesh > 50,
  );
  TestValidator.predicate(
    "the shell reaches beyond the rim",
    beyond.count > 50,
  );
  TestValidator.equals("no voxel in front is refused", census.airRefused, 0);
  TestValidator.equals("no voxel behind is admitted", census.fleshAdmitted, 0);
};

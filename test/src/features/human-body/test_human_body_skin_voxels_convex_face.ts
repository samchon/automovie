import { voxelizeHumanBodySkin } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * A flat face of a closed convex body keeps its exterior ball centres even
 * when the other incident faces give its vertices different pseudonormals.
 * The tetrahedron lies entirely in z <= 0, so positive z proves exterior
 * independently of the voxel sampler's normals or nearest-feature formula.
 * Inputs are local metres and the explicitly authored triangles wind outward.
 *
 * Scenarios:
 * 1. The shell above the +Z face admits a centre with positive z. Reversing
 *    all face windings excludes that same oriented-side candidate. Both
 *    arrangements pass the sampler's distance shell before sign is checked.
 */
export const test_human_body_skin_voxels_convex_face = (): void => {
  const skin = {
    positions: [
      -0.04, -0.04, 0, 0.04, -0.04, 0, 0, 0.04, 0, 0, 0, -0.04,
    ],
    indices: [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0],
  };
  const rho = 0.02;
  const cell = 0.008;
  const query = [0.004, 0.004, 0.02];
  const reversed = {
    positions: skin.positions,
    indices: [0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3],
  };
  const read = (surface: typeof skin) => {
    const voxels = voxelizeHumanBodySkin({
      skin: [surface], points: [0, 0, 0], pad: 0.036, cell,
    });
    const voxel = voxels.voxelOf(query);
    const squared = voxels.distance.squared[voxel];
    TestValidator.predicate(
      "the candidate is above the convex body and within the distance shell",
      voxels.centre(voxel)[2] > 0 &&
        squared >= ((rho - cell) / cell) ** 2 &&
        squared < ((rho + 2 * cell) / cell) ** 2,
    );
    return voxels.centres(rho)[voxel];
  };
  const outside = read(skin);
  const opposite = read(reversed);
  TestValidator.equals("an exterior centre above the flat face is admitted", outside, 1);
  TestValidator.equals("reversed winding excludes the exterior centre", opposite, 0);
};

import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit four rig influences per shared skin vertex.
 *
 * Every slot names a declared joint, every weight is nonnegative and
 * the four values sum to one at each vertex. The published basis rounds
 * weights to seven decimals, so the existing 1e-5 sum tolerance is a
 * serialization allowance rather than an adjustable shape coefficient.
 * This proves a valid skin-binding table; it does not prove that the
 * joints follow internal bones or that the posed skin avoids contact.
 */
export function assertHumanBodyRigSkin(
  basis: IAutoMovieHumanBodyBasis,
  declared: ReadonlySet<AutoMovieHumanoidBone>,
): void {
  for (const surface of basis.surfaces) {
    const vertices = surface.positions.length / 3;
    const skin = surface.skin;
    if (
      skin.joints.length === 0 ||
      new Set(skin.joints).size !== skin.joints.length ||
      skin.joints.some((bone) => !declared.has(bone)) ||
      skin.boneIndices.length !== vertices * 4 ||
      skin.weights.length !== vertices * 4 ||
      skin.boneIndices.some(
        (index) =>
          !Number.isInteger(index) || index < 0 || index >= skin.joints.length,
      ) ||
      skin.weights.some((weight) => !Number.isFinite(weight) || weight < 0)
    )
      throw new Error(
        "Body skin needs four declared-joint influences with nonnegative weights per vertex: " +
          surface.id,
      );
    for (let v = 0; v < vertices; v++) {
      const total =
        skin.weights[4 * v] +
        skin.weights[4 * v + 1] +
        skin.weights[4 * v + 2] +
        skin.weights[4 * v + 3];
      if (Math.abs(total - 1) > 1e-5)
        throw new Error(
          "Body skin weights must sum to one per vertex: " + surface.id,
        );
    }
  }
}

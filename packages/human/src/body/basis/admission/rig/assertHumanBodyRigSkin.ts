import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { assertHumanSkinBinding } from "../../../../common/basis/assertHumanSkinBinding";
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
    assertHumanSkinBinding({
      binding: surface.skin,
      vertices: surface.positions.length / 3,
      declared,
      surface: surface.id,
      description: "Body skin",
    });
  }
}

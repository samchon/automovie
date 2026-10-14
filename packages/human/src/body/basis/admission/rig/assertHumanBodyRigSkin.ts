import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { assertHumanSkinBinding } from "../../../../common/basis/assertHumanSkinBinding";
import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit four rig influences per shared skin vertex.
 *
 * Every slot names a declared joint, every weight is nonnegative and the four values sum to one at each vertex. The published basis rounds weights to seven decimals, so the existing 1e-5 sum tolerance is a serialization allowance rather than an adjustable shape coefficient. This proves a valid skin-binding table; it does not prove that the joints follow internal bones or that the posed skin avoids contact.
 *
 * @evidence contracts/common.md#principled-implementation The shared skin-binding guard admits four declared-joint slots per vertex with finite nonnegative weights and a serialization-sized unit-sum allowance.
 * @evidence contracts/common.md#clear-and-simple-design One body adapter supplies resident vertex count and declared joints while common skin-binding admission owns all weight/slot rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Serialized-weight tolerance cannot validate internal bone registration or posed contact and is not an adjustable shape coefficient.
 * @evidence contracts/common.md#meaningful-documentation The prose states four-slot ownership, unit-sum rounding allowance and the limits of binding validity.
 * @evidence contracts/performance.md#efficient-algorithms Every surface's four-influence table is scanned once by the common guard, costing O(V) vertices with fixed slots and declared-set lookups.
 * @evidence contracts/performance.md#reuse-equivalent-work Caller-admitted joint identities and the shared binding validator are reused without rebuilding rig maps or caching mutable tables.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains no binding copy or task; helper temporaries end on success/failure and source weights remain unchanged.
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

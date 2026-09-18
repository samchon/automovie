import { IAutoMovieHalfSpacePlane } from "./IAutoMovieHalfSpacePlane";

/**
 * A bounded convex cell represented by intersecting half-spaces.
 *
 * @evidence requirements/interior/spaces-and-occupancy.md#interior-space-visibility-culling Exposes `IAutoMovieConvexSpaceCell` as the portable data boundary for the interior space visibility culling requirement.
 * @evidence specifications/interior-space/space-level-zone-topology.md#interior-space-occupancy-activity-visibility Types `IAutoMovieConvexSpaceCell` for the interior space occupancy activity visibility system contract.
 */
export interface IAutoMovieConvexSpaceCell {
  /**
   * Stable cell identity within the environment.
   *
   * @evidence requirements/interior/spaces-and-occupancy.md#interior-space-visibility-culling Exposes `id` as the portable data boundary for the interior space visibility culling requirement.
   * @evidence specifications/interior-space/space-level-zone-topology.md#interior-space-occupancy-activity-visibility Types `id` for the interior space occupancy activity visibility system contract.
   */
  id: string;
  /**
   * Planes whose inside test is `dot(normal, point) <= offset`.
   *
   * @evidence requirements/interior/spaces-and-occupancy.md#interior-space-visibility-culling Exposes `planes` as the portable data boundary for the interior space visibility culling requirement.
   * @evidence specifications/interior-space/space-level-zone-topology.md#interior-space-occupancy-activity-visibility Types `planes` for the interior space occupancy activity visibility system contract.
   */
  planes: IAutoMovieHalfSpacePlane[];
}

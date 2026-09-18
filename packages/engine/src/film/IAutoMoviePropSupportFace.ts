import { IAutoMovieFootprint } from "../space/IAutoMovieFootprint";
import { IAutoMovieHeightSurface } from "../space/IAutoMovieHeightSurface";
import { surfaceHeightAt } from "../space/surfaceHeightAt";

/**
 * The world face a prop rests on, as one record both kinds of support answer.
 *
 * A building support patch and another prop's `stack-top` state their face in
 * different terms and are read here in one: a convex footprint on the ground
 * plan, and a rule saying how high the face stands over that footprint. The
 * patch already carries both. The affordance carries an extent in its host's
 * model frame, which becomes a face by travelling through the host's full
 * staged TRS, the same transform {@link propOccupancyBounds} measures the
 * resting prop through, so a scaled or turned host's top and the geometry that
 * shows it stay one surface rather than drifting apart.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-anchor-support IAutoMoviePropSupportFace carries the resolved support surface and its world transform as one measurable anchoring result.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement IAutoMoviePropSupportFace realizes furnishing placement clearance: The world face a prop rests on, as one record both kinds of support answer. A building support patch and another prop's `stack-top` state their face in different terms and are read here in one: a convex footprint on the ground plan, and a rule saying how high the face stands over that footprint. The patch already carries both. The affordance carries an extent in its host's model frame, which becomes a face by travelling through the host's full staged TRS, the same transform {@link propOccupancyBounds} measures the resting prop through, so a scaled or turned host's top and the geometry that shows it stay one surface rather than drifting apart.
 */
export interface IAutoMoviePropSupportFace {
  /**
   * The face's plan region in world XZ, holes and all.
   *
   * This carried the footprint's convex hull until #1868, which is why a crate
   * could be reported resting on the middle of an atrium: the hull floors the
   * void, and the gap query then measures the prop against ground that is not
   * there. A prop affordance's own top is a quad and is still one convex ring;
   * a support patch is whatever region its rings describe.
   *
   * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-anchor-support IAutoMoviePropSupportFace.polygon bounds the exact world-XZ bearing region used to decide whether the prop stands over its support.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement IAutoMoviePropSupportFace.polygon realizes furnishing placement clearance: The face's plan region in world XZ, holes and all. This carried the footprint's convex hull until #1868, which is why a crate could be reported resting on the middle of an atrium: the hull floors the void, and the gap query then measures the prop against ground that is not there. A prop affordance's own top is a quad and is still one convex ring; a support patch is whatever region its rings describe.
   */
  polygon: IAutoMovieFootprint;

  /**
   * How high the face stands, in the spelling {@link surfaceHeightAt} reads.
   *
   * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-anchor-support IAutoMoviePropSupportFace.height preserves declared support and anchoring: How high the face stands, in the spelling {@link surfaceHeightAt} reads.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement IAutoMoviePropSupportFace.height realizes furnishing placement clearance: How high the face stands, in the spelling {@link surfaceHeightAt} reads.
   */
  height: IAutoMovieHeightSurface;
}

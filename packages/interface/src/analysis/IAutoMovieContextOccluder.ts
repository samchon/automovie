import { IAutoMovieHalfSpacePlane } from "../architecture/IAutoMovieHalfSpacePlane";

/**
 * One neighbouring mass, as the intersection of its half-spaces.
 *
 * A convex mass is all a shading study needs and all this record allows. It is
 * a blocker, so it carries no material, no interior and no ownership: a
 * neighbour that could carry those would be a second building this work does
 * not own.
 *
 * Each plane keeps the points where `dot(normal, point) <= offset`, so normals
 * point out of the mass. Validation checks the plane count, non-zero finite
 * normals and finite offsets only; it does not prove the intersection is
 * non-empty or bounded.
 *
 * @evidence contracts/common.md#principled-implementation A convex mass as a half-space intersection lets the daylight solver run an analytic slab test per ray; boundedness is an unchecked premise, so an unbounded plane set passes validation and blocks every ray that enters it, however far away.
 * @evidence contracts/common.md#clear-and-simple-design Only id, label and planes are carried, with no material or interior, which keeps the record usable as a shading blocker and unusable as owned building geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Context occluders and authored shading solids share `validateSolidPlanes`, so a neighbour's mass is held to the same four-plane, finite, non-zero rule; the missing boundedness check is a stated gap, not a compensation.
 * @evidence contracts/common.md#meaningful-documentation States the inside convention of each plane, the four-plane minimum and why, id uniqueness within the context, and that emptiness and boundedness are not validated.
 */
export interface IAutoMovieContextOccluder {
  /**
   * Stable occluder identity, unique within the context and never equal to a
   * building-owned id.
   */
  id: string;

  /**
   * Non-blank open semantic label such as `neighbour-tower` or
   * `boundary-wall`.
   */
  kind: string;

  /**
   * Half-spaces whose intersection is the mass; at least four, since fewer
   * cannot bound a solid in three dimensions.
   */
  planes: IAutoMovieHalfSpacePlane[];
}

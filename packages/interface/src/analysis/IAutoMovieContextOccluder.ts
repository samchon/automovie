import { IAutoMovieHalfSpacePlane } from "../architecture/IAutoMovieHalfSpacePlane";

/**
 * One neighbouring mass, as the intersection of its half-spaces.
 *
 * A convex mass is all a shading study needs and all this record allows. It is
 * a blocker, so it carries no material, no interior and no ownership: a
 * neighbour that could carry those would be a second building the work does
 * not own.
 *
 * Each plane keeps the points where `dot(normal, point) <= offset`, so normals
 * point out of the mass. Validation checks the plane count, non-zero finite
 * normals and finite offsets only; it does not prove the intersection is
 * non-empty or bounded.
 *
 * @evidence contracts/common.md#principled-implementation A convex solid as a half-space intersection, which the daylight solver tests analytically with the slab method in `autoMovieSolidBlocks`; `validateSolidPlanes` checks at least four planes, finite normals longer than `1e-12`, and finite offsets.
 * @evidence contracts/common.md#clear-and-simple-design Id, kind and planes only, the same plane shape a logical space's convex cell uses, so `autoMovieContextSolids` passes the plane array through without conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty and unbounded intersections remain unchecked; reserved-id collision checks apply only when the caller supplies those ids. Ray clipping treats slopes within 1e-12 of the normal-relative parallel band as parallel, and raw binary64 intermediates can overflow, so admitted planes are not an exact visibility certificate.
 * @evidence contracts/common.md#meaningful-documentation States why the record is only a blocker, the inside convention and normal direction, exactly what validation checks and does not, the id scope, and the minimum plane count.
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

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

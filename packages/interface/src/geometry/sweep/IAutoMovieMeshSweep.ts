import type { IAutoMovieSweep } from "./IAutoMovieSweep";

/** Ring placement, closure and wall shading for direct sweep triangulation. */
export namespace IAutoMovieMeshSweep {
  /**
   * Triangulate a sweep directly into a closed mesh, for hard-edged members
   * such as profiles, rails, pipes and tapering piers that need no subdivision
   * cage.
   *
   * Rings sit at the given spine parameters, by default the chord-length shares
   * of the spine's own points, so a sweep along a polyline gets one ring per
   * corner and straight walls between them. Each ring is every loop of the
   * sweep at that parameter: a polygon section under parameter correspondence
   * gives exactly its corners, so corners stay corners; any other loop gives
   * `columns` points at even parameters. Rings are laid out by
   * `canonicalRegion`, outer loop counterclockwise and holes clockwise, so the
   * walls between consecutive rings face out of the solid and the hole walls
   * into the holes. Both ends are capped by triangulating the end rings as
   * planar regions (`trianglesOf`) unless `caps` is false.
   *
   * `flat` shading gives every wall triangle its own corners and plane normal,
   * so section corners and ring edges stay creases; `smooth` shares each ring
   * point between its walls and takes area-weighted vertex normals (`meshOf`),
   * so a polygon approximating a round section reads round. The atlas is
   * metric: on the walls `u` is the distance round the ring and `v` the spine
   * parameter times the spine's polygon length, the distance along a path of
   * straight legs; caps take their section-plane coordinates. A smooth wall
   * repeats each ring's first point at the end of the ring so the seam can
   * carry both `u` 0 and the ring's length, and pools the two normals there.
   *
   * Whether the solid intersects itself is the author's: a spine turning
   * tighter than the section is wide folds the walls through each other.
   */
  export type IProps = {
    /**
     * Authored sweep in model metres, borrowed for this synchronous meshing
     * call and admitted by compileAutoMovieSweep. Self-intersection of the
     * swept solid is not tested.
     */
    sweep: IAutoMovieSweep;

    /**
     * Normalized spine coordinates of successive rings. The mesher copies and
     * checks at least two finite strictly increasing values, exactly starting
     * at 0 and ending at 1. Omitted uses the spine control points' polygonal
     * chord-length shares.
     */
    rows?: readonly number[];

    /**
     * Safe integer samples per nonpolygon loop, at least three; omitted means
     * 32. Parameter-correspondence polygons use their authored corner count
     * instead, but this option is still validated.
     */
    columns?: number;

    /**
     * Whether to triangulate both end regions, including holes; omitted means
     * true. False returns the open walls.
     */
    caps?: boolean;

    /**
     * Wall normal sharing: flat duplicates triangle corners, smooth shares ring
     * vertices and pools seam normals. Omitted means flat; end caps keep
     * separate planar normals in either case.
     */
    shading?: "flat" | "smooth";
  };
}

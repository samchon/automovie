import type { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * The outer contour and optional voids of an authored planar region.
 *
 * All contours use one local x/y metre frame, with closure implicit and either
 * winding accepted. Malformed, intersecting or touching rings and invalid hole
 * containment refuse; numerical bridge or ear-search failure also throws
 * instead of returning repaired geometry.
 */
export namespace IAutoMovieTriangulateRegion {
  /**
   * A free-form planar region to triangulate: one arbitrary ring less its
   * holes.
   *
   * This is the kernel's escape from convexity. A convex hull is the wrong
   * answer for an L-shaped section, a channel, a cornice, or a tube, because
   * the hull covers ground the region does not; `extrudeAutoMovieProfile`
   * refuses a concave contour rather than quietly filling it in, and this is
   * what the refusal points at. The contour is taken as authored, each hole is
   * bridged into it, and the result is ear-clipped, so the triangles cover
   * exactly the enclosed area and nothing else. Coordinates are metres in the
   * region's own `x, y` plane.
   *
   * Rings are refused rather than repaired: fewer than three points, a
   * non-finite coordinate, a point repeated beside itself, a spike that doubles
   * back along its own edge, a ring enclosing no area, and a ring crossing
   * itself each raise their own diagnostic. Two rings may not touch or cross
   * either, and a hole must lie strictly inside the outer ring and outside
   * every other hole. A hole that does not is not a void this kernel guesses
   * at; it is a region the author has not described.
   *
   * Winding is canonicalized rather than demanded: the outer ring comes back
   * counter-clockwise and every hole clockwise, whichever way each was
   * authored, because which ring bounds the region and which is a void is
   * settled by containment and not by the order the points were typed in. The
   * emitted triangles are counter-clockwise, so the region faces +Z.
   * `sourceIndices` retains every canonical point's index in the original outer
   * then hole population. Winding changes ordering, never point identity.
   */
  export type IProps = {
    /**
     * Borrowed simple nonzero-area outer ring in local x/y metres, at least
     * three finite points with implicit closure; winding is canonicalized to
     * counter-clockwise.
     */
    outer: readonly IAutoMovieProfilePoint[];

    /**
     * Borrowed strictly interior disjoint rings in the same frame; omitted or
     * empty means none. Either winding is accepted and canonicalized to
     * clockwise.
     */
    holes?: readonly (readonly IAutoMovieProfilePoint[])[] | undefined;
  };
}

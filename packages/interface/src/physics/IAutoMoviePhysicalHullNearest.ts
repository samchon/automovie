import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Signed nearest-surface readings in a convex hull's local coordinate frame. */
export namespace IAutoMoviePhysicalHullNearest {
  /**
   * Signed nearest-surface reading for a query in a convex hull's own frame.
   *
   * Distance is metres, negative inside and zero on the surface; point and unit
   * normal are shape-local. `AutoMoviePhysicalHull.nearest` allocates the point but may
   * borrow a normal from its cached hull faces; callers must treat the returned
   * normal as read-only. The producer requires a volumetric hull. Interior
   * queries use the nearest face; outside edge queries use the direction toward
   * the query, with a face-normal fallback near zero distance.
   */
  export type IResult = {
    /** Signed surface separation in metres; negative inside the convex hull. */
    distance: number;

    /** New nearest surface point in the input hull's local frame, metres. */
    point: IAutoMovieVector3;

    /**
     * Outward unit direction in the hull frame; may alias a cached hull-face
     * normal, so do not mutate it.
     */
    normal: IAutoMovieVector3;
  };
}

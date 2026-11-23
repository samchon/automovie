import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** World-space balance geometry read by markAutoMovieBalance. */
export namespace IAutoMovieMarkBalance {
  /**
   * Turn a body's balance at one instant into inspection marks: the centre of
   * mass, or the extrapolated centre the caller balances on, as a point, and
   * the base of support as the polygon around the support points on the floor
   * plane.
   *
   * The base of support is the convex hull of the support points in the
   * horizontal XZ plane, as `resolveAutoMovieCenterOfMass.margin` measures
   * balance on it, drawn as a closed polyline through the hull's points at
   * their own heights; one support point is drawn as a point and two as a
   * segment. The centre is flagged when its margin of stability on that base is
   * negative, that is when it lies outside the base.
   *
   * | Kind      | Label             | Colour          | Path             |
   * | --------- | ----------------- | --------------- | ---------------- |
   * | `com`     | `centre of mass`  | Olive `6b8e23`  | `<path>/com`     |
   * | `support` | `base of support` | Sienna `a0522d` | `<path>/support` |
   *
   * Both are in world metres and unanchored. It throws when there is no support
   * point.
   */
  export type IProps = {
    /**
     * Caller-chosen subject path prefix; /com and /support identify the
     * resulting marks.
     */
    path: string;
    /**
     * Centre of mass or extrapolated balance centre in world metres; callers
     * supply finite coordinates.
     */
    centre: IAutoMovieVector3;
    /**
     * Nonempty support points in world metres, borrowed without mutation. Empty
     * input throws; XZ defines the convex hull while each point's y is retained
     * for drawing.
     */
    support: readonly IAutoMovieVector3[];
  };
}

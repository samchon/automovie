import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePerspectiveFrustumLens } from "./IAutoMoviePerspectiveFrustumLens";
import type { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * Borrowed lens and world-box inputs for an inclusive frustum intersection
 * test. The synchronous operation retains and mutates none of these records.
 */
export namespace IAutoMovieIntersectsPerspectiveFrustumBox {
  /**
   * Whether a world-space axis-aligned box intersects a perspective-camera
   * frustum under finite, ordered geometry and a valid lens.
   *
   * Both bodies are convex, and two convex polyhedra meet exactly when an edge
   * of one meets the other: every vertex of the intersection is a vertex of one
   * body lying inside the other, or a crossing of one body's edge with the
   * other's face, and each of those puts some edge of one body inside the
   * other. So the twelve box edges are clipped against the frustum's six
   * half-spaces, and the twelve frustum edges against the box's three slabs.
   * Neither half alone is the answer: a box small enough to sit inside the
   * frame is found only by the first, and a frustum that pierces a mass far
   * wider than itself, a camera standing inside a crowd or above one, only by
   * the second. Touching counts as meeting, and a malformed crop throws the
   * `RangeError` of {@link deliveryCropNdc}.
   *
   * This is what a required subject with a real extent is judged against in
   * `realizeShotContract`. A segment through one point cannot answer for a
   * mass: it reports a crowd absent whenever the frame holds its flank instead
   * of its middle, and present whenever that one point is on screen no matter
   * where the rest of the unit stands.
   */
  export type IProps = IAutoMoviePerspectiveFrustumLens & {
    /**
     * World placement in metres and nearly unit rotation; camera looks along
     * local -Z.
     */
    camera: IAutoMovieResolvedCamera;

    /**
     * Finite world-axis lower corner in metres, no greater than max on each
     * axis.
     */
    min: IAutoMovieVector3;

    /** Finite world-axis upper corner in metres; zero-width axes are permitted. */
    max: IAutoMovieVector3;
  };
}

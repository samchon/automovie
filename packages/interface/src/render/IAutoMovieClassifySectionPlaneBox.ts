import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieSectionPlane } from "./IAutoMovieSectionPlane";

/** Data and callback contracts shared by the ClassifySectionPlaneBox operations. */
export namespace IAutoMovieClassifySectionPlaneBox {
  /**
   * Classify a world-space axis-aligned box, in metres, against a set of
   * section planes: `kept` when every plane keeps all of it, `cut` when some
   * plane removes all of it, and `crossed` otherwise. An empty plane list keeps
   * every box.
   *
   * Each plane uses two support corners rather than eight: over a box n̂·(p −
   * p0) is linear, so its extremes sit at the corners chosen per axis by the
   * normal's sign. The corner farthest toward the removed side decides whether
   * the box is wholly kept, and the opposite corner whether it is wholly
   * removed. A computed zero distance is kept. Binary64 boundary rounding and
   * overflow in the shared distance arithmetic remain; finite box coordinates
   * alone do not certify exact distances.
   *
   * Throws a `RangeError` when a corner coordinate is not finite or `min`
   * exceeds `max` on an axis, because the support corners of such a box are
   * swapped and a box wholly kept would read as cut; a degenerate plane throws
   * as {@link autoMovieSectionPlaneDistance} does.
   *
   * This tells a reviewer which subjects a section left in view. It is not
   * folded into {@link intersectsPerspectiveFrustumBox}: an authored camera
   * declares no plane, so folding it into delivery acceptance would add a term
   * that is always empty there while making the acceptance of a sliced subject
   * a silent decision.
   */
  export type IProps = {
    /** Cutting planes; a point any of them removes is removed. */
    planes: readonly IAutoMovieSectionPlane[];

    /** Lower corner, world metres; finite and not above `max` on any axis. */
    min: IAutoMovieVector3;

    /** Upper corner, world metres; finite. */
    max: IAutoMovieVector3;
  };
}

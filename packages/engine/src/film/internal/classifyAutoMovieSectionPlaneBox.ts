import {
  type AutoMovieSectionPlaneState,
  type IAutoMovieClassifySectionPlaneBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieSectionPlaneDistance } from "../autoMovieSectionPlaneDistance";

/** The three axes a box corner is chosen on. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/**
 * Classify a world-space axis-aligned box, in metres, against a set of section
 * planes: `kept` when every plane keeps all of it, `cut` when some plane
 * removes all of it, and `crossed` otherwise. An empty plane list keeps every
 * box.
 *
 * Each plane uses two support corners rather than eight: over a box n̂·(p − p0)
 * is linear, so its extremes sit at the corners chosen per axis by the normal's
 * sign. The corner farthest toward the removed side decides whether the box is
 * wholly kept, and the opposite corner whether it is wholly removed. A computed
 * zero distance is kept. Binary64 boundary rounding and overflow in the shared
 * distance arithmetic remain; finite box coordinates alone do not certify exact
 * distances.
 *
 * Throws a `RangeError` when a corner coordinate is not finite or `min` exceeds
 * `max` on an axis, because the support corners of such a box are swapped and a
 * box wholly kept would read as cut; a degenerate plane throws as
 * {@link autoMovieSectionPlaneDistance} does.
 *
 * This tells a reviewer which subjects a section left in view. It is not folded
 * into {@link intersectsPerspectiveFrustumBox}: an authored camera declares no
 * plane, so folding it into delivery acceptance would add a term that is always
 * empty there while making the acceptance of a sliced subject a silent
 * decision.
 */
export function classifyAutoMovieSectionPlaneBox(
  props: IAutoMovieClassifySectionPlaneBox.IProps,
): AutoMovieSectionPlaneState {
  for (const axis of AXES)
    if (props.min[axis] > props.max[axis])
      throw new RangeError(
        `Section box ${axis} range [${props.min[axis]}, ${props.max[axis]}] must be finite with min not above max.`,
      );
  let crossed: boolean = false;
  for (const plane of props.planes) {
    function corner(removedSide: boolean): IAutoMovieVector3 {
      return {
        x: plane.normal.x > 0 === removedSide ? props.max.x : props.min.x,
        y: plane.normal.y > 0 === removedSide ? props.max.y : props.min.y,
        z: plane.normal.z > 0 === removedSide ? props.max.z : props.min.z,
      };
    }
    // If even the extreme toward the removed side survives, the whole box does.
    if (autoMovieSectionPlaneDistance(plane, corner(true)) <= 0) continue;
    // If even the extreme toward the kept side is removed, the whole box is.
    if (autoMovieSectionPlaneDistance(plane, corner(false)) > 0) return "cut";
    crossed = true;
  }
  return crossed ? "crossed" : "kept";
}

import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieSectionPlaneState } from "./AutoMovieSectionPlaneState";
import { IAutoMovieSectionPlane } from "./IAutoMovieSectionPlane";
import { autoMovieSectionPlaneDistance } from "./autoMovieSectionPlaneDistance";

/** The three axes a box corner is chosen on. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/**
 * Classify a world-space axis-aligned box, in metres, against a set of section planes: `kept` when every plane keeps all of it, `cut` when some plane removes all of it, and `crossed` otherwise. An empty plane list keeps every box.
 *
 * Each plane uses two support corners rather than eight: over a box n̂·(p − p0) is linear, so its extremes sit at the corners chosen per axis by the normal's sign. The corner farthest toward the removed side decides whether the box is wholly kept, and the opposite corner whether it is wholly removed. A computed zero distance is kept. Binary64 boundary rounding and overflow in the shared distance arithmetic remain; finite box coordinates alone do not certify exact distances.
 *
 * Throws a `RangeError` when a corner coordinate is not finite or `min` exceeds `max` on an axis, because the support corners of such a box are swapped and a box wholly kept would read as cut; a degenerate plane throws as {@link autoMovieSectionPlaneDistance} does.
 *
 * This tells a reviewer which subjects a section left in view. It is not folded into {@link intersectsPerspectiveFrustumBox}: an authored camera declares no plane, so folding it into delivery acceptance would add a term that is always empty there while making the acceptance of a sliced subject a silent decision.
 *
 * @evidence contracts/common.md#principled-implementation A linear function's support corners give its exact-real extrema over an ordered box, which this function checks before selecting them. Two shared distance evaluations implement that criterion per plane; their products, sums and boundary comparisons retain binary64 rounding and overflow limits. Crossed means no single plane wholly removes the box and at least one fails to wholly keep it, not proof that the combined kept half-spaces intersect it.
 * @evidence contracts/common.md#clear-and-simple-design The box counterpart of `autoMovieSectionPlanesKeepPoint`, both reading `autoMovieSectionPlaneDistance` for the sign convention and the degenerate-plane refusal, and kept out of frustum acceptance for the stated reason.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no subject or plane; the boundary rule is the shared distance's, and a malformed box is refused rather than classified by swapped corners.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, the three verdicts and the empty-plane case, the support-corner method, the touching rule with its reason, each throwing case, and why the test stays out of frustum acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the plane count with two distance evaluations per plane instead of eight, and an early return on the first plane that removes the whole box.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure classification of one box that coordinates nothing across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; it allocates two corner vectors per plane and returns one state.
 */
export function classifyAutoMovieSectionPlaneBox(props: {
  /** Cutting planes; a point any of them removes is removed. */
  planes: readonly IAutoMovieSectionPlane[];

  /** Lower corner, world metres; finite and not above `max` on any axis. */
  min: IAutoMovieVector3;

  /** Upper corner, world metres; finite. */
  max: IAutoMovieVector3;
}): AutoMovieSectionPlaneState {
  for (const axis of AXES)
    if (
      Number.isFinite(props.min[axis]) === false ||
      Number.isFinite(props.max[axis]) === false ||
      props.min[axis] > props.max[axis]
    )
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

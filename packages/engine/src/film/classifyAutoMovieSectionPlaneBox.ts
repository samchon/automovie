import { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieSectionPlaneState } from "./AutoMovieSectionPlaneState";
import { IAutoMovieSectionPlane } from "./IAutoMovieSectionPlane";
import { autoMovieSectionPlaneDistance } from "./autoMovieSectionPlaneDistance";

/**
 * Classify a world-space axis-aligned box against a set of section planes.
 *
 * Each plane is decided exactly, without walking eight corners: over a box
 * `n̂·(p − p0)` is linear, so its extremes sit at the two corners chosen per
 * axis by the sign of the normal's component. The corner farthest toward the
 * removed side decides whether the box is wholly kept, and the corner farthest
 * toward the kept side whether it is wholly removed.
 *
 * A box merely touching a plane is not removed: the touching face sits at
 * exactly zero, which {@link autoMovieSectionPlaneDistance} keeps, so a wall
 * standing on the cutting level still reads as present.
 *
 * This is what tells a reviewer which subjects a section actually left in view.
 * It is deliberately NOT folded into {@link intersectsPerspectiveFrustumBox}: an
 * authored camera declares no plane, so folding it into delivery acceptance
 * would add a term that is always empty there while making the acceptance of a
 * sliced subject a silent decision.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Reports whether a declared cut leaves a subject's bound whole, removes it, or crosses it, with plane-level contact kept.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Produces the specified `kept`, `cut`, and `crossed` outcome for a current geometry bound under the optional clipping planes.
 */
export const classifyAutoMovieSectionPlaneBox = (props: {
  planes: readonly IAutoMovieSectionPlane[];
  min: IAutoMovieVector3;
  max: IAutoMovieVector3;
}): AutoMovieSectionPlaneState => {
  let crossed = false;
  for (const plane of props.planes) {
    const corner = (removedSide: boolean): IAutoMovieVector3 => {
      const picked: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const axis of ["x", "y", "z"] as const)
        picked[axis] =
          plane.normal[axis] > 0 === removedSide
            ? props.max[axis]
            : props.min[axis];
      return picked;
    };
    // If even the extreme toward the removed side survives, the whole box does.
    if (autoMovieSectionPlaneDistance(plane, corner(true)) <= 0) continue;
    // If even the extreme toward the kept side is removed, the whole box is.
    if (autoMovieSectionPlaneDistance(plane, corner(false)) > 0) return "cut";
    crossed = true;
  }
  return crossed ? "crossed" : "kept";
};

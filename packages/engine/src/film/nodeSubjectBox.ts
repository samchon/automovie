import {
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { placeTransformedPoint } from "./placeTransformedPoint";
import { pointSubjectBox } from "./pointSubjectBox";

/**
 * The world box one staged node fills, given the model-space box of what it
 * draws.
 *
 * The eight corners of `extent` go through the node's own placement with
 * {@link placeTransformedPoint}, the arithmetic that placed the parts the
 * extent was measured from, and the result is their axis-aligned range, so a
 * yawed or scaled element is boxed where it stands rather than where its model
 * file lies. For a rotated node that range encloses the rotated box, so it can
 * be wider than the drawn geometry but never narrower.
 *
 * `performShot` frames a node subject from this box, `realizeShotContract` and
 * the camera-clearance reports grade the same subject from it, and the
 * production film-grammar pass reads it too, so a camera solved to hold a mass
 * is tested against the mass it was solved for.
 *
 * An extent whose horizontal span is exactly zero is a point with a height
 * rather than geometry, the shape {@link nodeSubjectExtent} returns when
 * nothing could be measured, and goes to {@link pointSubjectBox}: only the
 * placement's translation applies, because a rotation cannot turn a segment
 * about the axis it lies on, and a rig span or stand-in height is an estimate
 * of the subject rather than a measurement that a scale should stretch.
 *
 * @param placement The node's world transform.
 * @param extent The model-space box of what the node draws, in metres.
 * @returns A new world box in metres.
 *
 * @evidence contracts/common.md#principled-implementation The axis-aligned bound of a transformed box is the range of its eight transformed corners, because an affine image of a box is the convex hull of its corners' images; the corners go through the same scale-rotate-translate order the renderer uses, and the zero-width extent is routed to the point box by an exact comparison because `nodeSubjectExtent` writes literal zeros.
 * @evidence contracts/common.md#clear-and-simple-design One box rule read by the framing solve, the shot-contract grade, the clearance reports and the film-grammar diagnostics, so the box a camera was solved for is the box it is graded against.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node, model or shot is special-cased; the point-box route is chosen by the shape of the extent, which encodes that nothing was measured, not by who is asking.
 * @evidence contracts/common.md#meaningful-documentation States how the corners are placed, that a rotated box widens, every consumer that must agree on it, the zero-width route and why rotation and scale do not apply there, and the frames and units.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: eight corner placements folded into a running minimum and maximum without building a corner array.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one placement and one extent; `performShot` memoizes the measured extent it is fed, and this constant-time placement is recomputed per instant because the placement moves.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The eight placed corners are discarded as they are folded; the caller owns the returned box, which shares no object with the placement or the extent.
 */
export const nodeSubjectBox = (
  placement: IAutoMovieTransform,
  extent: IAutoMovieSubjectBox,
): IAutoMovieSubjectBox => {
  if (
    extent.min.x === 0 &&
    extent.max.x === 0 &&
    extent.min.z === 0 &&
    extent.max.z === 0
  )
    return pointSubjectBox(placement.translation, {
      min: extent.min.y,
      max: extent.max.y,
    });
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const x of [extent.min.x, extent.max.x])
    for (const y of [extent.min.y, extent.max.y])
      for (const z of [extent.min.z, extent.max.z]) {
        const corner: IAutoMovieVector3 = placeTransformedPoint(placement, {
          x,
          y,
          z,
        });
        if (corner.x < min.x) min.x = corner.x;
        if (corner.y < min.y) min.y = corner.y;
        if (corner.z < min.z) min.z = corner.z;
        if (corner.x > max.x) max.x = corner.x;
        if (corner.y > max.y) max.y = corner.y;
        if (corner.z > max.z) max.z = corner.z;
      }
  return { min, max };
};

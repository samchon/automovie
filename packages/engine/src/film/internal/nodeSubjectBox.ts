import {
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { placeTransformedPoint } from "./placeTransformedPoint";
import { pointSubjectBox } from "./pointSubjectBox";

/*
 * The world-axis-aligned bound of a supplied model-space subject box.
 *
 * The eight corners of extent go through placeTransformedPoint and their
 * axis-aligned range encloses the transformed input box, assuming finite
 * transform arithmetic. This bounds the portable parts or proxies that the
 * input represents; it does not inspect external asset bytes or renderer-only
 * deformation.
 *
 * `performShot` frames a node subject from this box, `realizeShotContract` and
 * the camera-clearance reports grade the same subject from it, and the
 * production film-grammar pass reads it too, so a camera solved to hold a mass
 * is tested against the mass it was solved for.
 *
 * An extent whose X and Z endpoints are all zero is treated as a point with a
 * height, the shape nodeSubjectExtent returns when nothing could be measured,
 * and goes to pointSubjectBox: only the placement's translation applies by the
 * stand-in boxing policy. This shape test also catches measured vertical
 * segments, so their rotation and scale are ignored here; it does not
 * distinguish them from unmeasured subjects.
 * Parameter placement: The node's world transform.
 * Parameter extent: The model-space box of what the node draws, in metres.
 * Returns: A new world box in metres.
 */
export function nodeSubjectBox(
  placement: IAutoMovieTransform,
  extent: IAutoMovieSubjectBox,
): IAutoMovieSubjectBox {
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
}

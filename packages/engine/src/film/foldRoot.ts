import { IAutoMovieTransform } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { placeTransformedPoint } from "./placeTransformedPoint";

/**
 * Fold a sampled pose root into a node's staged placement, giving the world
 * transform the viewer draws the actor's root at.
 *
 * The root is node-local: its translation is placed by the whole staged
 * transform, scale then rotation then translation, and its rotation follows the
 * staged rotation. Root scale is dropped, as Engine FK and the viewer drop it
 * (#1052), so the result keeps the staged scale. A null root means the actor
 * stands at its staged base, and `base` itself is returned.
 *
 * The rotation is exact when the staged scale is uniform, which staging gives
 * every actor; under a non-uniform staged scale the drawn root basis is
 * sheared, and the returned rotation and scale are its rotation-then-scale
 * reading.
 */
export function foldRoot(
  base: IAutoMovieTransform,
  root: IAutoMovieTransform | null,
): IAutoMovieTransform {
  if (root === null) return base;
  return {
    translation: placeTransformedPoint(base, root.translation),
    rotation: Quaternion.multiply(base.rotation, root.rotation),
    scale: base.scale,
  };
}

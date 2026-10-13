import {
  IAutoMovieDesignPoint,
  IAutoMovieDesignSourceFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { designFrameScale } from "./designFrameScale";

/** Direction vectors shorter than this are treated as having no direction. */
const AXIS_EPSILON = 1e-12;

/**
 * Map one source-space point onto world metres through its frame.
 *
 * The mapping is `origin + axisX * (x - anchor.x) * s + axisY * (y - anchor.y)
 *
 * - S`, with `s`the settled metres-per-unit, followed by the frame's optional
 *   placement transform. Axes are normalized here rather than demanded
 *   normalized from the author, so a hand-written`{ x: 0, y: 0, z: 2 }` means
 *   the direction it plainly means instead of doubling every measurement.
 *
 * Throws when the frame's scale is unsettled: producing a number there is the
 * exact failure this whole graph exists to prevent.
 */
export const designReferenceWorldPoint = (
  frame: IAutoMovieDesignSourceFrame,
  point: IAutoMovieDesignPoint,
): IAutoMovieVector3 => {
  const meters = designFrameScale(frame);
  if (meters === null)
    throw new Error(
      `design frame "${frame.id}" has no settled scale, so source point (${point.x}, ${point.y}) has no world position.`,
    );
  const x = unit(frame.axisX);
  const y = unit(frame.axisY);
  const dx = (point.x - frame.anchor.x) * meters;
  const dy = (point.y - frame.anchor.y) * meters;
  const mapped: IAutoMovieVector3 = {
    x: frame.origin.x + x.x * dx + y.x * dy,
    y: frame.origin.y + x.y * dx + y.y * dy,
    z: frame.origin.z + x.z * dx + y.z * dy,
  };
  const transform = frame.transform;
  if (transform === null) return mapped;
  const scaled: IAutoMovieVector3 = {
    x: mapped.x * transform.scale.x,
    y: mapped.y * transform.scale.y,
    z: mapped.z * transform.scale.z,
  };
  const rotated = Quaternion.rotateVector(
    Quaternion.normalize(transform.rotation),
    scaled,
  );
  return {
    x: rotated.x + transform.translation.x,
    y: rotated.y + transform.translation.y,
    z: rotated.z + transform.translation.z,
  };
};

const lengthOf = (value: IAutoMovieVector3): number =>
  Math.hypot(value.x, value.y, value.z);

const unit = (value: IAutoMovieVector3): IAutoMovieVector3 => {
  const length = lengthOf(value);
  if (length <= AXIS_EPSILON) return value;
  return { x: value.x / length, y: value.y / length, z: value.z / length };
};

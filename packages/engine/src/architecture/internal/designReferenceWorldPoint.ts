import {
  IAutoMovieDesignPoint,
  IAutoMovieDesignSourceFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { designFrameScale } from "./designFrameScale";

/*
 * Map one source-space point onto world metres through its frame.
 *
 * With `s` the settled metres-per-unit, the point becomes `origin` plus
 * normalized `axisX` times `(x - anchor.x) * s` plus normalized `axisY` times
 * `(y - anchor.y) * s`. Optional placement applies scale, normalized rotation,
 * then translation. Non-orthogonal axes retain their skew. An axis no longer
 * than `1e-12` is used unchanged: only a zero axis removes its coordinate
 * contribution; `validateDesignReference` refuses these short axes. Finite
 * inputs can still overflow intermediate subtraction, length or multiplication,
 * so this mapping does not certify a finite result.
 *
 * Throws an `Error` when the frame's scale is unsettled: producing a number
 * there is the exact failure this whole graph exists to prevent.
 * Parameter frame: Frame the point was read in.
 * Parameter point: Source-space point in the frame's own units.
 * Returns: World position in metres.
 */
export function designReferenceWorldPoint(
  frame: IAutoMovieDesignSourceFrame,
  point: IAutoMovieDesignPoint,
): IAutoMovieVector3 {
  const meters: number | null = designFrameScale(frame);
  if (meters === null)
    throw new Error(
      `design frame "${frame.id}" has no settled scale, so source point (${point.x}, ${point.y}) has no world position.`,
    );
  const x: IAutoMovieVector3 = unit(frame.axisX);
  const y: IAutoMovieVector3 = unit(frame.axisY);
  const dx: number = (point.x - frame.anchor.x) * meters;
  const dy: number = (point.y - frame.anchor.y) * meters;
  const mapped: IAutoMovieVector3 = {
    x: frame.origin.x + x.x * dx + y.x * dy,
    y: frame.origin.y + x.y * dx + y.y * dy,
    z: frame.origin.z + x.z * dx + y.z * dy,
  };
  const transform: IAutoMovieDesignSourceFrame["transform"] = frame.transform;
  if (transform === null) return mapped;
  const rotated: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.normalize(transform.rotation),
    {
      x: mapped.x * transform.scale.x,
      y: mapped.y * transform.scale.y,
      z: mapped.z * transform.scale.z,
    },
  );
  return AutoMovieEngineVector3.add(rotated, transform.translation);
}

/*
 * Axes no longer than this threshold are returned without normalization.
 */
const AXIS_EPSILON: number = 1e-12;

/*
 * Normalize an axis longer than the threshold; otherwise return it unchanged.
 */
const unit: (value: IAutoMovieVector3) => IAutoMovieVector3 = (
  value: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const length: number = Math.hypot(value.x, value.y, value.z);
  if (length <= AXIS_EPSILON) return value;
  return { x: value.x / length, y: value.y / length, z: value.z / length };
};

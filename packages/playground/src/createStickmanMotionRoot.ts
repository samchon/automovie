import { Quaternion } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

/**
 * Place the authored whole-body root in local metres with degree yaw about +Y and unit scale. Translation is choreography in the model's receiving frame, not physical integration or a ground/contact observation.
 *
 * @evidence contracts/common.md#principled-implementation The canonical quaternion owner converts the named degree yaw about unit +Y while translation retains authored metre coordinates and scale stays one.
 * @evidence contracts/common.md#clear-and-simple-design A root record constructor separates pose placement from skeletal joint articulation and engine playback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored coordinates are not clamped into guessed ground contact or treated as measured movement; this constructor supplies no finite/range admission.
 * @evidence contracts/common.md#meaningful-documentation The comment names units/frame, yaw axis, scale and nonsimulated provenance.
 * @evidence contracts/performance.md#efficient-algorithms One constant-time quaternion conversion and three fixed records bound work/storage; later root interpolation belongs to the engine.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each placement creates independent mutable transform data; no cross-clip result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned transform and its records, with no worker, GPU handle or running task acquired here.
 */
export function createStickmanMotionRoot(
  x: number,
  y: number,
  z: number,
  yawDeg: number,
): IAutoMovieTransform {
  return {
    translation: { x, y, z },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yawDeg),
    scale: { x: 1, y: 1, z: 1 },
  };
}

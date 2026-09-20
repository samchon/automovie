import { IAutoMovieDeliveryCrop, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { resolveAutoMovieDeliveryCrop } from "./resolveAutoMovieDeliveryCrop";

interface IAutoMovieDeliveryCropNdc {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  whole: boolean;
}

const deliveryCropNdc = (
  crop: IAutoMovieDeliveryCrop | undefined,
): IAutoMovieDeliveryCropNdc => {
  const resolved = resolveAutoMovieDeliveryCrop(crop);
  return {
    left: 2 * resolved.left - 1,
    right: 2 * resolved.right - 1,
    top: 1 - 2 * resolved.top,
    bottom: 1 - 2 * resolved.bottom,
    width: resolved.right - resolved.left,
    height: resolved.bottom - resolved.top,
    whole:
      resolved.left === 0 &&
      resolved.top === 0 &&
      resolved.right === 1 &&
      resolved.bottom === 1,
  };
};

/**
 * Project a world point into the camera's normalized device coordinates. The
 * camera looks down its local −Z (glTF), so `depth = −localZ` is positive in
 * front of the lens; NDC is `local / (depth · tan(fovY/2))`, horizontally
 * widened by `aspect`. Behind the camera (`depth ≤ 0`) the NDC is unbounded:
 * the caller reads `depth` (and the near/far/rectangle bounds) to decide, this
 * never clamps.
 *
 * @evidence requirements/camera/validation.md#camera-hand-computable-geometry Converts a world point to normalized device coordinates and positive camera depth from explicit FOV and aspect inputs.
 * @evidence requirements/camera/scope-and-identity.md#camera-geometric-truth Computes image position and depth from the resolved world camera transform and world point rather than from shot labels or intended framing.
 * @evidence requirements/camera/projection-lens-and-sensor.md#camera-optical-conventions Applies an inverse-quaternion view transform, local negative-Z depth, vertical half-FOV, and width-to-height aspect before returning unclamped NDC coordinates.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-computable-geometry-results projectToNdc realizes independently computable image geometry: Project a world point into the camera's normalized device coordinates. The camera looks down its local −Z (glTF), so `depth = −localZ` is positive in front of the lens; NDC is `local / (depth · tan(fovY/2))`, horizontally widened by `aspect`. Behind the camera (`depth ≤ 0`) the NDC is unbounded: the caller reads `depth` (and the near/far/rectangle bounds) to decide, this never clamps.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Fixes perspective projection to the engine's inverse-quaternion, negative-Z-forward, vertical-FOV, and width-to-height aspect convention.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding Uses the resolved camera origin and orientation as the sole spatial authority for this point projection.
 */
export const projectToNdc = (
  camera: IAutoMovieResolvedCamera,
  point: IAutoMovieVector3,
  halfY: number,
  aspect: number,
  crop?: IAutoMovieDeliveryCrop,
): { ndcX: number; ndcY: number; depth: number } => {
  const local = Quaternion.rotateVector(
    Quaternion.inverse(camera.rotation),
    Vector3.subtract(point, camera.position),
  );
  const depth = -local.z;
  const ndcX = local.x / (depth * halfY * aspect);
  const ndcY = local.y / (depth * halfY);
  const gate = deliveryCropNdc(crop);
  if (gate.whole) return { ndcX, ndcY, depth };
  return {
    ndcX: (ndcX - (gate.left + gate.right) / 2) / gate.width,
    ndcY: (ndcY - (gate.bottom + gate.top) / 2) / gate.height,
    depth,
  };
};

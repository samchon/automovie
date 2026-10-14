import {
  IAutoMovieDeliveryCrop,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieDeliveryCropNdc } from "./IAutoMovieDeliveryCropNdc";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { deliveryCropNdc } from "./deliveryCropNdc";

/**
 * Project a world point into the delivered frame's normalized device coordinates.
 *
 * The camera looks down its local −Z, as glTF cameras do, so `depth = −localZ` is positive in front of the lens, and NDC is `local / (depth · halfY)` vertically and `local / (depth · halfY · aspect)` horizontally. With a crop, NDC is rescaled so the crop window spans `[−1, 1]` on both axes; without one, the whole gate does. Behind the lens (`depth <= 0`) the NDC is meaningless and at `depth = 0` it is infinite or `NaN`: this never clamps, and the caller reads `depth`, the near and far bounds and the `[−1, 1]` rectangle to decide. A malformed crop throws the `RangeError` of {@link deliveryCropNdc}.
 *
 * @param camera Camera placement, looking down its local −Z.
 * @param point World point in metres.
 * @param halfY Vertical half-field tangent, `tan(fovY / 2)`.
 * @param aspect Frame width over height.
 * @param crop Delivery crop, or the whole gate when omitted.
 * @returns NDC on both axes and the viewing depth in metres.
 *
 * @evidence contracts/common.md#principled-implementation The pinhole perspective projection: the point is brought into the camera frame by the inverse rotation about the lens and divided by depth times the half-field tangents, then an affine remap takes the crop window's NDC span to `[-1, 1]`; it relies on a unit camera rotation and a point in front of the lens, and states that it does not guard the latter.
 * @evidence contracts/common.md#clear-and-simple-design One projection shared by the shot contract, the visual read, pose keypoints, the film grammar and geometry measurement, with the crop conversion shared with the frustum tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamping or depth floor is applied, so callers see the real geometry and decide visibility themselves; the whole-gate branch skips a division by one rather than changing the answer.
 * @evidence contracts/common.md#meaningful-documentation States the axis convention, the projection formula, how a crop rescales NDC, the behind-lens and zero-depth results, who decides visibility, the crop error, and each parameter's frame and units.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one quaternion inverse, one rotation, one crop conversion and a handful of divisions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure projection of one point that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates a few temporary vectors and retains nothing; the caller owns the returned record.
 */
export function projectToNdc(
  camera: IAutoMovieResolvedCamera,
  point: IAutoMovieVector3,
  halfY: number,
  aspect: number,
  crop?: IAutoMovieDeliveryCrop,
): { ndcX: number; ndcY: number; depth: number } {
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(camera.rotation),
    Vector3.subtract(point, camera.position),
  );
  const depth: number = -local.z;
  const ndcX: number = local.x / (depth * halfY * aspect);
  const ndcY: number = local.y / (depth * halfY);
  const gate: IAutoMovieDeliveryCropNdc = deliveryCropNdc(crop);
  if (gate.whole) return { ndcX, ndcY, depth };
  return {
    ndcX: (ndcX - (gate.left + gate.right) / 2) / gate.width,
    ndcY: (ndcY - (gate.bottom + gate.top) / 2) / gate.height,
    depth,
  };
}

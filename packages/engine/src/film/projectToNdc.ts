import {
  IAutoMovieDeliveryCrop,
  IAutoMovieVector3,
} from "@automovie/interface";

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

import {
  IAutoMovieDeliveryCrop,
  type IAutoMovieDeliveryCropNdc,
  type IAutoMovieProjectToNdc,
  type IAutoMovieResolvedCamera,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { deliveryCropNdc } from "./deliveryCropNdc";

/*
 * Project a world point into the delivered frame's normalized device
 * coordinates.
 *
 * The camera looks down its local −Z, as glTF cameras do, so `depth = −localZ`
 * is positive in front of the lens, and NDC is `local / (depth · halfY)`
 * vertically and `local / (depth · halfY · aspect)` horizontally. With a crop,
 * NDC is rescaled so the crop window spans `[−1, 1]` on both axes; without one,
 * the whole gate does. Behind the lens (`depth <= 0`) the NDC is meaningless
 * and at `depth = 0` it is infinite or `NaN`: this never clamps, and the caller
 * reads `depth`, the near and far bounds and the `[−1, 1]` rectangle to decide.
 * A malformed crop throws the `RangeError` of deliveryCropNdc.
 * Parameter camera: Camera placement, looking down its local −Z.
 * Parameter point: World point in metres.
 * Parameter halfY: Vertical half-field tangent, `tan(fovY / 2)`.
 * Parameter aspect: Frame width over height.
 * Parameter crop: Delivery crop, or the whole gate when omitted.
 * Returns: NDC on both axes and the viewing depth in metres.
 */
export function projectToNdc(
  camera: IAutoMovieResolvedCamera,
  point: IAutoMovieVector3,
  halfY: number,
  aspect: number,
  crop?: IAutoMovieDeliveryCrop,
): IAutoMovieProjectToNdc.IResult {
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

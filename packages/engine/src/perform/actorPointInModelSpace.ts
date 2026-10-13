import { IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieActorWorldFrame } from "./IAutoMovieActorWorldFrame";

/**
 * Undo an actor's rigid world frame to express a world metre point in its model frame. The frame has translation and a quaternion rotation, with no scale.
 *
 * @evidence contracts/common.md#principled-implementation Subtracts the frame position and applies the inverse quaternion, exactly inverting the reference staged translation-and-yaw transformation for admitted finite coordinates and a nonzero orientation.
 * @evidence contracts/common.md#clear-and-simple-design The same inverse conversion serves locomotion, static reaches and live arm target samples without duplicating transform order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This context represents rigid placement only; it does not flatten or approximate a nonuniform-scale affine transform.
 * @evidence contracts/common.md#meaningful-documentation States world/model metres, inverse rigid transform order, finite point/frame premises and absent scale.
 * @evidence contracts/performance.md#efficient-algorithms Constant vector and quaternion arithmetic with fresh result values, independent of rig or scene size.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers may reuse an unchanged frame for their action; the helper reads its supplied point and frame without a global identity cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned vector and intermediate values are call-local; no handle, task or retained geometry exists.
 */
export const actorPointInModelSpace: (world: IAutoMovieVector3, frame: IAutoMovieActorWorldFrame) => IAutoMovieVector3 = (
  world: IAutoMovieVector3,
  frame: IAutoMovieActorWorldFrame,
): IAutoMovieVector3 =>
  Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(world, frame.position),
  );

import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** The axis a handle is wrapped about: its affordance frame's local +X. */
const HANDLE: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * A named point of a prop as a hand's grip at a film second: the displayed
 * point and normal, the handle's wrapped axis carried by the prop's frame,
 * and half its stated aperture as the radius, as a rider's hands read a
 * carried handle (`HumanRideHands`).
 *
 * @param context The action's context.
 * @param on The prop's subject id.
 * @param id The point's id.
 * @param seconds Film seconds.
 * @param axis The refusal axis naming the parameter that chose the point.
 * @returns The grip in world metres.
 * @throws {HumanRefusal} When the prop declares no such point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the axis convention and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The performance's own aim resolves the displayed point; the affordance frame composed with the prop's displayed frame gives the axis.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the point, aim it, then compose the axis.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing point is refused, never replaced by the prop's origin.
 * @evidence contracts/development/implementation.md#efficient-algorithms One aim, one frame read and one scan of the prop's affordances.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the grip convention of the rider's hands.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function readPropGrip(
  context: Pick<IAutoMovieMotionHumanActionContext, "prop" | "aim">,
  on: string,
  id: string,
  seconds: number,
  axis: string,
): IAutoMovieMotionHumanMountRider.IHoldGrip {
  const support: IAutoMovieMotionHumanPropReader = context.prop(on);
  if (!Object.hasOwn(support.prop.points, id))
    throw new HumanRefusal({
      kind: "affordance",
      axis,
      value: id,
      feasible: {
        kind: "alternatives",
        values: Object.keys(support.prop.points),
      },
      reason: `${on} has no point named ${id}`,
      fix: "name one of the prop's points",
    });
  const placed: IAutoMovieMotionHumanProp.IPlacedPoint = context.aim(
    { kind: "prop", subject: on, point: id },
    seconds,
  );
  const affordance: IAutoMovieAffordance | undefined =
    support.prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean => item.id === id,
    );
  const rotation: IAutoMovieQuaternion | undefined =
    affordance === undefined
      ? undefined
      : Quaternion.multiply(
          support.frame(seconds).rotation,
          affordance.frame.rotation,
        );
  return {
    point: placed.point,
    normal: placed.normal,
    radius: (affordance?.aperture ?? 0) / 2,
    ...(rotation === undefined
      ? {}
      : { axis: Quaternion.rotateVector(rotation, HANDLE) }),
  };
}

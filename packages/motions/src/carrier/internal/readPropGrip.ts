import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * A named point of a prop as a hand's grip at a film second: the displayed
 * point and normal, the handle's wrapped axis carried by the prop's frame, and
 * half its stated aperture as the radius, as a rider's hands read a carried
 * handle (`HumanRideHands`).
 * Parameter context: The action's context.
 * Parameter on: The prop's subject id.
 * Parameter id: The point's id.
 * Parameter seconds: Film seconds.
 * Parameter axis: The refusal axis naming the parameter that chose the point.
 * Returns: The grip in world metres.
 * When the prop declares no such point.
 */
export function readPropGrip(
  context: readPropGrip.IContext,
  on: string,
  id: string,
  seconds: number,
  axis: string,
): IAutoMovieMotionHumanMountRider.IHoldGrip {
  const support: readPropGrip.IReader = context.prop(on);
  if (!Object.hasOwn(support.prop.points, id))
    throw new AutoMovieMotionHumanRefusal({
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
      : AutoMovieEngineQuaternion.multiply(
          support.frame(seconds).rotation,
          affordance.frame.rotation,
        );
  return {
    point: placed.point,
    normal: placed.normal,
    radius: (affordance?.aperture ?? 0) / 2,
    ...(rotation === undefined
      ? {}
      : { axis: AutoMovieEngineQuaternion.rotateVector(rotation, HANDLE) }),
  };
}

/*
 * What a prop's grip is read from.
 */
export namespace readPropGrip {
  /*
   * The action's prop readers and aim.
   */
  export interface IContext {
    /*
     * A prop's reader, by subject id.
     */
    prop(subject: string): IReader;

    /*
     * A target's displayed point and normal at a film second.
     */
    aim: IAutoMovieMotionHumanActionContext["aim"];
  }

  /*
   * What a grip reads of a prop: its points and affordances, and its frame.
   */
  export interface IReader {
    /*
     * The prop's named points and affordances.
     */
    prop: Pick<IAutoMovieMotionHumanProp, "points" | "affordances">;

    /*
     * The prop's frame at a film second.
     */
    frame(seconds: number): Pick<IAutoMovieRigidTransform, "rotation">;
  }
}

/*
 * The axis a handle is wrapped about: its affordance frame's local +X.
 */
const HANDLE: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

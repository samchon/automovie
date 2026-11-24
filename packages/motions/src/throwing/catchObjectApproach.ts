import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanThrowObjectLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBall } from "../ballStrike/HumanBall";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import type { catchObject } from "./catchObject";
import { readThrowObjectLaunch } from "./readThrowObjectLaunch";
import { throwObject } from "./throwObject";

/**
 * Where and when the throw is met.
 *
 * @param context The catch's context.
 * @param frame The catcher's standing floor frame.
 * @param arm The catcher's arm length, metres.
 * @returns The interception.
 * @throws {HumanRefusal} When the anchor is not a throw, a self-toss never
 *   rises to the chest, or another's throw starts within reach or never comes
 *   within it.
 */
export function catchObjectApproach(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCatchObject.IParams>,
  frame: IAutoMovieMotionHumanFrame,
  arm: number,
): catchObject.IInterception {
  const placed: IAutoMovieMotionHumanPlacedAction = context.action(
    context.params.partner,
  );
  const launch: IAutoMovieMotionHumanThrowObjectLaunch.ILaunch | undefined =
    readThrowObjectLaunch(placed.plan);
  if (launch === undefined)
    throw new HumanRefusal({
      kind: "participant",
      axis: "partner",
      value: context.params.partner,
      feasible: {
        kind: "alternatives",
        values: ["the anchor of a throwObject action"],
      },
      reason: `${context.params.partner} is a ${placed.name}, not a throw`,
      fix: "give the throw an anchor and name that anchor in from",
    });
  const ahead: number =
    HumanFrame.local(frame, launch.point).z - catchObjectApproach.REACH * arm;
  const closing: number = -HumanFrame.local(
    { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
    launch.velocity,
  ).z;
  const released: number = placed.start + launch.seconds - context.start;

  // The launch flies the prop's origin; the catch meets the ball's centre,
  // which stands off the origin for a ball not modelled about its centre:
  // that offset as the ball leaves the hand, carried along the path.
  const leaving: number = placed.start + launch.seconds;
  const offset: IAutoMovieVector3 = Vector3.subtract(
    HumanBall(context, context.params.ball, leaving, "ball").centre,
    context.prop(context.params.ball).frame(leaving).position,
  );
  const centre = (seconds: number): IAutoMovieVector3 =>
    Vector3.add(
      throwObject.path(launch, Math.max(0, seconds - released)),
      offset,
    );
  // A toss of the catcher's own is met as it falls to the chest
  // (`TOSS` of the stature), within the arms wherever it rises.
  if (placed.subject === context.subject) {
    const g: number = AutoMovieGravity.STANDARD;
    const fall: number =
      launch.point.y - catchObjectApproach.TOSS * context.body.measure.stature;
    const vy: number = launch.velocity.y;
    if (!(vy * vy + 2 * g * fall >= 0) || !(vy > 0))
      throw new HumanRefusal({
        kind: "reach",
        axis: "partner",
        value: context.params.partner,
        reason: "the toss never rises to the chest to be caught",
        fix: "toss the object up, above the chest",
      });
    const flight: number = (vy + Math.sqrt(vy * vy + 2 * g * fall)) / g;
    return {
      contact: released + flight,
      speed: { ...launch.velocity, y: vy - g * flight },
      before: centre,
    };
  }
  if (ahead <= 0 || !(closing > 0))
    throw new HumanRefusal({
      kind: "reach",
      axis: "partner",
      value: context.params.partner,
      reason:
        ahead <= 0
          ? "the throw starts within the reach"
          : "the throw never comes within reach",
      fix:
        ahead <= 0
          ? "stand farther from the thrower, beyond the arms' reach of the release"
          : "stand on the throw's path, or aim the throw at the catcher",
    });
  const flight: number = ahead / closing;
  return {
    contact: released + flight,
    speed: {
      ...launch.velocity,
      y: launch.velocity.y - AutoMovieGravity.STANDARD * flight,
    },
    before: centre,
  };
}

/**
 * The interception of a catch (catchObject): another's throw met where its path
 * first comes within `REACH` arm lengths ahead of the catcher, or the catcher's
 * own toss met as it falls to the chest (`TOSS`).
 */
export namespace catchObjectApproach {
  /**
   * How far ahead of the root another's throw is met, arm lengths
   * (provisional).
   */
  export const REACH: number = 0.6;

  /**
   * The height a self-tossed object is caught at on its way down, a share of
   * the stature: the lower chest (provisional).
   */
  export const TOSS: number = 0.72;
}

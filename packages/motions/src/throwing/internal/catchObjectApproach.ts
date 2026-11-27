import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanThrowObjectLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBall } from "../../ballStrike/internal/HumanBall";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
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
    const flight: number = catchObjectApproach.tossFlight(
      context.params.partner,
      vy,
      fall,
    );
    return {
      contact: released + flight,
      speed: { ...launch.velocity, y: vy - g * flight },
      before: centre,
    };
  }
  const flight: number = catchObjectApproach.meetFlight(
    context.params.partner,
    ahead,
    closing,
  );
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
  /**
   * How long a self-toss flies before it falls to the catch: the later root of
   * `fall + vy t - g t² / 2 = 0`.
   *
   * @param partner The toss's anchor.
   * @param vy The toss's rising speed, m/s.
   * @param fall How far the release stands above the catch, metres.
   * @returns Seconds.
   * @throws {HumanRefusal} When the toss does not rise or never reaches the
   *   catch's height.
   */
  export function tossFlight(
    partner: string,
    vy: number,
    fall: number,
  ): number {
    const g: number = AutoMovieGravity.STANDARD;
    if (!(vy * vy + 2 * g * fall >= 0) || !(vy > 0))
      throw new HumanRefusal({
        kind: "reach",
        axis: "partner",
        value: partner,
        reason: "the toss never rises to the chest to be caught",
        fix: "toss the object up, above the chest",
      });
    return (vy + Math.sqrt(vy * vy + 2 * g * fall)) / g;
  }

  /**
   * How long another's throw flies before it comes within reach: the distance
   * ahead over the closing speed.
   *
   * @param partner The throw's anchor.
   * @param ahead How far the release lies beyond the reach, metres.
   * @param closing The throw's closing speed, m/s.
   * @returns Seconds.
   * @throws {HumanRefusal} When the throw starts within reach or never closes.
   */
  export function meetFlight(
    partner: string,
    ahead: number,
    closing: number,
  ): number {
    if (ahead <= 0 || !(closing > 0))
      throw new HumanRefusal({
        kind: "reach",
        axis: "partner",
        value: partner,
        reason:
          ahead <= 0
            ? "the throw starts within the reach"
            : "the throw never comes within reach",
        fix:
          ahead <= 0
            ? "stand farther from the thrower, beyond the arms' reach of the release"
            : "stand on the throw's path, or aim the throw at the catcher",
      });
    return ahead / closing;
  }
}

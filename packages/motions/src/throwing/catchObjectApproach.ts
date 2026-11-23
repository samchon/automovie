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
import { throwObject } from "./throwObject";

/**
 * The interception of a catch (catchObject): another's throw met where
 * its path first comes within `REACH` arm lengths ahead of the
 * catcher, or the catcher's own toss met as it falls to the chest
 * (`TOSS`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two interceptions.
 * @evidence contracts/development/design.md#principled-representation The path is the throw's own launch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two constants and one reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is typed in; the path comes from the throw's plan.
 */
export namespace catchObjectApproach {
  /** How far ahead of the root another's throw is met, arm lengths (provisional). */
  export const REACH: number = 0.6;

  /** The height a self-tossed object is caught at on its way down, a share of the stature: the lower chest (provisional). */
  export const TOSS: number = 0.72;

  /**
   * Where and when the throw is met.
   *
   * @param context The catch's context.
   * @param frame The catcher's standing floor frame.
   * @param arm The catcher's arm length, metres.
   * @returns The interception.
   * @throws {HumanRefusal} When the anchor is not a throw, a self-toss never rises to the chest, or another's throw starts within reach or never comes within it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two interceptions and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Another's throw is met where its drag-free path, linear on the floor plan, crosses the reach line; a self-toss where its parabola falls to the chest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Launch, self-toss, reach line.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A path that does not come within reach is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Closed form.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The throw's own launch and path.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned path retains the launch.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCatchObject.IParams>,
    frame: IAutoMovieMotionHumanFrame,
    arm: number,
  ): catchObject.IInterception {
    const placed: IAutoMovieMotionHumanPlacedAction = context.action(
      context.params.partner,
    );
    const launch: IAutoMovieMotionHumanThrowObjectLaunch.ILaunch | undefined =
      throwObject.of(placed.plan);
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
    const ahead: number = HumanFrame.local(frame, launch.point).z - REACH * arm;
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
      HumanBall.of(context, context.params.ball, leaving, "ball").centre,
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
      const fall: number = launch.point.y - TOSS * context.body.measure.stature;
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
}

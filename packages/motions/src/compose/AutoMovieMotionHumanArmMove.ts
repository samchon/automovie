import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";
import { AutoMovieMotionHumanArmTarget } from "./AutoMovieMotionHumanArmTarget";

/**
 * An arm moved between an origin and a target by a weight, and the three
 * windows of it a phrase is made of: the reach, the hold and the retract.
 *
 * The members are `AutoMovieMotionHumanArm`'s, which names them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file holds and who names it.
 * @evidence contracts/development/design.md#principled-representation One movement by a weight in [0, 1]; a reach, a hold and a retract are that movement with a rising, a full and a falling weight.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The move, its three windows and the bowed path they share; `AutoMovieMotionHumanArm` re-exports each by name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The target and origin records are `AutoMovieMotionHumanArmTarget`'s, read and not restated.
 */
export namespace AutoMovieMotionHumanArmMove {
  /**
   * An arm moved between an origin and a target by a weight.
   *
   * @param props The movement.
   * @returns The primitive, on the arm's and the hand's channels.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves, by what, and the channels claimed.
   * @evidence contracts/development/implementation.md#principled-implementation A path of the surface that is straight, or bows out to the arm's own side by the movement's `curvature` (a manner's share of the path's length, EMOTE's indirect Space; none when absent), and a spherical interpolation of the hand, both by one weight, with the fingers shaped by the same weight (Jeannerod 1984).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target evaluation, one blend and one posture update.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weight is clamped to [0, 1] so an overshooting time course cannot extrapolate the hand past its target; at weight 1 the target is used as it is, with no blend error.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `point`, `goal` and `AutoMovieMotionHumanHand.fingers`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
   */
  export function move(props: AutoMovieMotionHumanArmTarget.IMove): IAutoMovieMotionHumanPrimitive {
    const limb: "leftArm" | "rightArm" = `${props.side}Arm`;
    return {
      channels: [limb, `${props.side}Hand`],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const target: AutoMovieMotionHumanArmTarget.ITarget = props.target(posture, seconds);
        const s: number = Math.min(1, Math.max(0, props.weight(seconds)));
        const placed: AutoMovieMotionHumanArmTarget.ITarget =
          s >= 1
            ? target
            : {
                ...target,
                point: bowed(
                  posture,
                  props.side,
                  AutoMovieMotionHumanArmTarget.point(posture, props.origin),
                  target.point,
                  s,
                  props.curvature ?? 0,
                ),
                rotation: Quaternion.slerp(
                  Quaternion.multiply(
                    HumanFrame.turn(posture.yaw),
                    props.origin.rotation,
                  ),
                  target.rotation,
                  s,
                ),
              };
        return {
          ...posture,
          joints: {
            ...posture.joints,
            ...AutoMovieMotionHumanHand.fingers(
              props.side,
              target.shape,
              target.curl ?? 0,
              s,
            ),
          },
          limbs: {
            ...posture.limbs,
            [limb]: AutoMovieMotionHumanArmTarget.goal(props.body, props.side, placed),
          },
        };
      },
    };
  }

  /**
   * A point of a path from one point to another that bows out to the arm's
   * own side: the straight path's point plus a sideways deviation that is
   * greatest at the middle and none at both ends (EMOTE's indirect Space).
   * The side is the performer's left for the left arm and right for the
   * right, less its part along the path; a path that runs sideways bows up.
   */
  const bowed = (
    posture: Pick<IHumanPosture, "yaw">,
    side: HumanHand.Side,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    share: number,
    curvature: number,
  ): IAutoMovieVector3 => {
    const straight: IAutoMovieVector3 = Vector3.lerp(from, to, share);
    const path: IAutoMovieVector3 = Vector3.subtract(to, from);
    const length: number = Vector3.length(path);
    if (curvature === 0 || length < 1e-9) return straight;
    const along: IAutoMovieVector3 = Vector3.scale(path, 1 / length);
    const across = (axis: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(axis, Vector3.scale(along, Vector3.dot(axis, along)));
    const outward: IAutoMovieVector3 = across(
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        { x: side === "left" ? 1 : -1, y: 0, z: 0 },
      ),
    );
    const direction: IAutoMovieVector3 =
      Vector3.length(outward) > 0.1 ? outward : across({ x: 0, y: 1, z: 0 });
    return Vector3.add(
      straight,
      Vector3.scale(
        Vector3.normalize(direction),
        curvature * length * Math.sin(Math.PI * share),
      ),
    );
  };

  /**
   * A hand carried from an origin to its target between two instants, on the
   * clock's minimum-jerk progress.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The arm.
   * @param window The instants the reach starts and arrives at.
   * @param from Where the hand starts.
   * @param target The target.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ends, the window and the time course.
   * @evidence contracts/development/implementation.md#principled-implementation A point-to-point hand movement follows the minimum-jerk profile (Flash and Hogan 1985), which the clock's progress is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `move` with the clock's progress as the weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The window is two named instants of the clock, so no time is written twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `move` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function reach(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: HumanHand.Side,
    window: readonly [string, string],
    from: AutoMovieMotionHumanArmTarget.IOrigin,
    target: AutoMovieMotionHumanArmTarget.Frame,
  ): IAutoMovieMotionHumanPrimitive {
    return move({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      origin: from,
      target,
      weight: (seconds: number): number =>
        clock.progress(window[0], window[1], seconds),
    });
  }

  /**
   * A hand kept on its target between two instants; the target may move (a
   * stroke's path, a partner's hand, a carried prop).
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The arm.
   * @param window The instants the hold starts and ends at.
   * @param target The target.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the window and that the target may move.
   * @evidence contracts/development/implementation.md#principled-implementation A hand on its target is the movement at weight 1 throughout, so the target frame alone decides where the hand is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `move` with a constant weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The origin `move` requires is never read at weight 1, so the identity origin passed is inert and stated here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `move` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function hold(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: HumanHand.Side,
    window: readonly [string, string],
    target: AutoMovieMotionHumanArmTarget.Frame,
  ): IAutoMovieMotionHumanPrimitive {
    return move({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      origin: { point: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
      target,
      weight: (): number => 1,
    });
  }

  /**
   * A hand taken from its target back to an origin between two instants, on
   * the clock's minimum-jerk progress.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The arm.
   * @param window The instants the retraction starts and arrives at.
   * @param target The target the hand leaves.
   * @param to Where the hand ends.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ends, the window and the time course.
   * @evidence contracts/development/implementation.md#principled-implementation A reach run backwards: the same minimum-jerk profile with the weight going from 1 to 0.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `move` with one minus the clock's progress.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The target stays a frame, so a hand leaving a moving thing starts from where the thing is.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `move` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function retract(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: HumanHand.Side,
    window: readonly [string, string],
    target: AutoMovieMotionHumanArmTarget.Frame,
    to: AutoMovieMotionHumanArmTarget.IOrigin,
  ): IAutoMovieMotionHumanPrimitive {
    return move({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      origin: to,
      target,
      weight: (seconds: number): number =>
        1 - clock.progress(window[0], window[1], seconds),
    });
  }
}

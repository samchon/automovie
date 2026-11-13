import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanLean } from "./AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanReach } from "./AutoMovieMotionHumanReach";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * The lean of a standing body into a hand's work that lies beyond its
 * standing arm: the trunk tips about the hips by the least pitch that keeps
 * the wrist within a share of the arm's length, the hips moving back by the
 * balance shift of that pitch, and straightens as the work comes nearer.
 *
 * A person wiping the far side of a counter or pulling a drawer does not
 * lock the elbow: the trunk inclines as far as the hand needs and no
 * further. Work still out of reach at the lean's limit
 * (`AutoMovieMotionHumanReach.LEAN_LIMIT`) is refused, since it is walked up
 * to first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement, what bounds it, the refusal and why a person moves so.
 * @evidence contracts/development/design.md#principled-representation A pitch as a function of the posture and the stroke's progress, found from the wrist's place; the hips' shift is the balance shift of that pitch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The props, the solved lean and its primitive; read by the operate and wipe laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wrist is the caller's own goal, so the lean is measured to what the arm must place, never to the hand's surface.
 */
export namespace AutoMovieMotionHumanLeanInto {
  /**
   * What a lean is solved from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The body, the posture it stands in, the arm, the share of its length kept and the wrist's goal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `solve`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The refusal's words are the caller's, which knows what is out of reach.
   */
  export interface IProps {
    /** The body. */
    body: IHumanBody;

    /** The posture the body stands in before it leans. */
    standing: IHumanPosture;

    /** The working hand. */
    side: HumanHand.Side;

    /** The share of the arm's length (upper arm and forearm) the wrist is kept within. */
    share: number;

    /** The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres. */
    wrist: (posture: IHumanPosture, progress: number) => IAutoMovieVector3;

    /** The refusal's message for a wrist left `beyond` metres out of reach at a lean of `limit` degrees. */
    refuse: (beyond: number, limit: number) => string;
  }

  /**
   * A solved lean.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it returns and its unit.
   * @evidence contracts/development/design.md#principled-representation The pitch and the posture it gives, the two things a law reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The pitch is read on the posture given, so a moved root is followed.
   */
  export interface ILean {
    /** The least pitch in degrees that reaches at a progress; throws the refusal when the limit does not. */
    pitch: (posture: IHumanPosture, progress: number) => number;

    /** A posture tipped by a pitch in degrees, the hips shifted back to balance it. */
    tip: (posture: IHumanPosture, pitch: number) => IHumanPosture;

    /** The primitive that leans in by `ready`, follows the stroke's progress and straightens from `relax`. */
    primitive: (
      clock: AutoMovieMotionClock.IClock,
    ) => IAutoMovieMotionHumanPrimitive;
  }

  /**
   * Solve the lean of a stroke.
   *
   * @param props The body, the standing posture, the hand, the share and the wrist's goal.
   * @returns The lean.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result; the namespace states the movement.
   * @evidence contracts/development/implementation.md#principled-implementation The hips' shift per sine of pitch is the balance shift at the limit; the pitch is the bisected root of the wrist's distance beyond the kept share, which grows shorter monotonically as the shoulder comes forward.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One balance solve, one bisection, one primitive.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A wrist beyond reach at the limit throws; the leaned root is lowered until the planted legs reach their feet.
   * @evidence contracts/development/implementation.md#efficient-algorithms Twelve halvings per read to a hundredth of a degree.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanLean.tip`, `HumanBalance.shift`, `AutoMovieMotionHumanReach.check` and `resolveHumanPosture.lower`; the balance shift is solved once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closes over the props and one number.
   */
  export function solve(props: IProps): ILean {
    const sine = (degrees: number): number =>
      Math.sin((degrees * Math.PI) / 180);
    const limit: number = AutoMovieMotionHumanReach.LEAN_LIMIT;
    const back: number =
      HumanBalance.shift(
        props.body,
        (shift: number): IHumanPosture =>
          AutoMovieMotionHumanLean.tip(
            props.body,
            props.standing,
            limit,
            shift,
          ),
      ) / sine(limit);
    const tip = (posture: IHumanPosture, pitch: number): IHumanPosture =>
      AutoMovieMotionHumanLean.tip(
        props.body,
        posture,
        pitch,
        back * sine(pitch),
      );
    const pitch = (posture: IHumanPosture, progress: number): number => {
      const wrist: IAutoMovieVector3 = props.wrist(posture, progress);
      const beyond = (degrees: number): number => {
        const check: AutoMovieMotionHumanReach.ICheck =
          AutoMovieMotionHumanReach.check(
            props.body,
            tip(posture, degrees),
            `${props.side}Arm`,
            wrist,
          );
        return check.distance - props.share * check.length;
      };
      if (beyond(0) <= 0) return 0;
      let low: number = 0;
      let high: number = limit;
      if (beyond(high) > 0)
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: beyond(high),
          feasible: { kind: "range", minimum: null, maximum: 0, unit: "m" },
          reason: props.refuse(beyond(high), high),
          fix: "come nearer first (approach the target), or aim at a region within the arm's reach",
        });
      while (high - low > 0.01) {
        const middle: number = (low + high) / 2;
        if (beyond(middle) <= 0) high = middle;
        else low = middle;
      }
      return high;
    };
    return {
      pitch,
      tip,
      primitive: (
        clock: AutoMovieMotionClock.IClock,
      ): IAutoMovieMotionHumanPrimitive => ({
        channels: ["root", "trunk"],
        from: 0,
        to: clock.duration,
        write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
          const leaned: IHumanPosture = tip(
            posture,
            clock.envelope(["start", "ready"], ["relax", "end"], seconds) *
              pitch(
                posture,
                clock.progress("strokeStart", "strokeEnd", seconds),
              ),
          );
          return {
            ...leaned,
            root: resolveHumanPosture.lower(props.body, leaned).root,
          };
        },
      }),
    };
  }
}

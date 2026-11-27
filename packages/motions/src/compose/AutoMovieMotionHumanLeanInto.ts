import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanLeanInto,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanReach,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBalance } from "../everyday/HumanBalance";
import { HumanRefusal } from "../law/HumanRefusal";
import { lowerHumanPosture } from "../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { AutoMovieMotionHumanLean } from "./AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanReach } from "./AutoMovieMotionHumanReach";

/** The record of `ISolvePitchNearest`'s site. */
type ISolvePitchNearest = { pitch: number; beyond: number };

/** The alternatives of `SolveLimb`'s site. */
type SolveLimb = "leftArm" | "rightArm";

/**
 * The lean of a standing body into a hand's work that lies beyond its standing
 * arm: the trunk tips about the hips by the least pitch that keeps the wrist
 * within a share of the arm's length, and straightens as the work comes nearer.
 * With balance asked (`IAutoMovieMotionHumanBalance`), the hips move back by
 * the balance shift of that pitch so the centre of mass stays over the feet
 * where it stood; otherwise they stay where they stand and no centre of mass is
 * computed.
 *
 * A person wiping the far side of a counter or pulling a drawer does not lock
 * the elbow: the trunk inclines as far as the hand needs and no further. Work
 * still out of reach at the lean's limit
 * (`AutoMovieMotionHumanReach.LEAN_LIMIT`) is refused, since it is walked up to
 * first.
 */
export namespace AutoMovieMotionHumanLeanInto {
  /**
   * Solve the lean of a stroke.
   *
   * @param props The body, the standing posture, the hand, the share, the
   *   wrist's goal and the arm's.
   * @returns The lean.
   */
  export function solve(
    props: IAutoMovieMotionHumanLeanInto.IProps,
  ): IAutoMovieMotionHumanLeanInto.ILean {
    // The step of the scan for the first pitch that reaches, degrees
    // (provisional: the measured distances change by a few millimetres per
    // five degrees near their least, so a reach is not stepped over).
    const SCAN: number = 5;
    // The step of the pitch the hips' shift is solved at, degrees
    // (provisional: the shift changes by a few millimetres per step, so the
    // proportion between two steps misplaces the centre by less).
    const KNOT: number = 5;
    const limit: number = props.limit ?? AutoMovieMotionHumanReach.LEAN_LIMIT;
    const limb: SolveLimb = `${props.side}Arm`;
    const checkReach: ReturnType<
      typeof AutoMovieMotionHumanReach.prepareCheck
    > = AutoMovieMotionHumanReach.prepareCheck(props.body, limb);

    // The standing posture as the balance weighs it: lowered onto the
    // planted legs, the working arm on its goal.
    const weighed: (
      posture: IAutoMovieMotionHumanPosture,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => {
      const lowered: IAutoMovieMotionHumanPosture = {
        ...posture,
        root: lowerHumanPosture(props.body, posture).root,
      };
      return props.arm === undefined
        ? lowered
        : {
            ...lowered,
            limbs: { ...lowered.limbs, [limb]: props.arm(lowered) },
          };
    };
    // The hips' shift at each step of the pitch, solved on the standing
    // posture tipped there: the centre held where the unleaned body with its
    // arm placed has it, so a pitch of 0 shifts nothing. Only when balance
    // is asked (`props.balance`); otherwise the hips stay where they stand.
    // Every knot the pitch can reach, 0 to the limit, solved here.
    const held: number | undefined =
      props.balance === true
        ? HumanBalance.offset(props.body, weighed(props.standing))
        : undefined;
    const steps: readonly number[] = Array.from(
      { length: Math.ceil(limit / KNOT) + 1 },
      (_: unknown, index: number): number =>
        index === 0 || held === undefined
          ? 0
          : HumanBalance.shift(
              props.body,
              (shift: number): IAutoMovieMotionHumanPosture =>
                weighed(
                  AutoMovieMotionHumanLean.tip(
                    props.body,
                    props.standing,
                    Math.min(limit, index * KNOT),
                    shift,
                  ),
                ),
              HumanBalance.RANGE,
              held,
            ),
    );
    const step: (index: number) => number = (index: number): number =>
      steps[index]!;
    // Between two steps the shift is carried in proportion, so it follows
    // the pitch continuously.
    const back: (pitch: number) => number = (pitch: number): number => {
      const at: number = Math.min(limit, Math.max(0, pitch)) / KNOT;
      const below: number = Math.floor(at);
      const share: number = at - below;
      return share === 0
        ? step(below)
        : step(below) * (1 - share) + step(below + 1) * share;
    };
    const tip: IAutoMovieMotionHumanLeanInto.ILean["tip"] = (
      posture: IAutoMovieMotionHumanPosture,
      pitch: number,
    ): IAutoMovieMotionHumanPosture =>
      AutoMovieMotionHumanLean.tip(props.body, posture, pitch, back(pitch));
    const pitch: IAutoMovieMotionHumanLeanInto.ILean["pitch"] = (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): number => {
      const wrist: IAutoMovieVector3 = props.wrist(posture, progress);
      const operation: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const beyond: (degrees: number) => number = (degrees: number): number => {
        const check: IAutoMovieMotionHumanReach.ICheck = checkReach(
          tip(posture, degrees),
          wrist,
          operation,
        );
        return check.distance - props.share * check.length;
      };
      if (beyond(0) <= 0) return 0;

      // The distance does not always fall with the lean: a wrist above the
      // shoulder comes nearer for the first degrees and moves away after,
      // as the shoulder drops. So the lean is scanned upward for the first
      // pitch that reaches, and the least pitch lies between it and the
      // sample before; a reach that opens and closes inside one step of the
      // scan is not found.
      let low: number = 0;
      let high: number | undefined;
      let nearest: ISolvePitchNearest = {
        pitch: 0,
        beyond: beyond(0),
      };
      for (let k: number = 1; k * SCAN < limit + SCAN; ++k) {
        const degrees: number = Math.min(limit, k * SCAN);
        const short: number = beyond(degrees);
        if (short <= 0) {
          high = degrees;
          break;
        }
        if (short < nearest.beyond) nearest = { pitch: degrees, beyond: short };
        low = degrees;
      }
      if (high === undefined)
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: nearest.beyond,
          feasible: { kind: "range", minimum: null, maximum: 0, unit: "m" },
          reason: props.refuse(nearest.beyond, nearest.pitch),
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
        clock: IAutoMovieMotionClock,
      ): IAutoMovieMotionHumanPrimitive => ({
        channels: ["root", "trunk"],
        from: 0,
        to: clock.duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          _before?: IAutoMovieMotionHumanPrimitive.Reader,
          resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        ): IAutoMovieMotionHumanPosture => {
          const leaned: IAutoMovieMotionHumanPosture = tip(
            posture,
            clock.envelope(["start", "ready"], ["relax", "end"], seconds) *
              pitch(
                posture,
                clock.progress("strokeStart", "strokeEnd", seconds),
                resolution,
              ),
          );
          return {
            ...leaned,
            root: lowerHumanPosture(props.body, leaned, undefined, resolution)
              .root,
          };
        },
      }),
    };
  }
}

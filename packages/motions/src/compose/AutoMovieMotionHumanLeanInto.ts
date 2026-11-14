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
 * balance shift of that pitch so the centre of mass stays over the feet
 * where it stood, and straightens as the work comes nearer.
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
   * @evidence contracts/development/design.md#principled-representation The body, the posture it stands in, the arm, the share of its length kept, the wrist's goal and the arm's.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, all read by `solve`; the arm's goal is optional because a caller with only a wrist point has no arm to weigh.
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

    /**
     * The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the arguments, a posture and the stroke progress in [0, 1], and the wrist goal returned in world metres.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    wrist: (posture: IHumanPosture, progress: number) => IAutoMovieVector3;

    /**
     * The working arm's goal on a posture at the stroke's start, so the
     * balance weighs the arm where it reaches; the arm as the posture holds
     * it when absent.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the goal returned, why the balance reads it and the default.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    arm?: (posture: IHumanPosture) => IHumanPosture.IGoal;

    /**
     * The refusal's message for a wrist left `beyond` metres out of reach at a lean of `limit` degrees.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two arguments, the metres out of reach and the lean limit in degrees, and that the returned message is the refusal's words.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
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
    /**
     * The least pitch in degrees that reaches at a progress; throws the refusal when the limit does not.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the arguments, a posture and the stroke progress, the returned pitch in degrees and that a limit that does not reach throws the refusal.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    pitch: (posture: IHumanPosture, progress: number) => number;

    /**
     * A posture tipped by a pitch in degrees, the hips shifted back to balance it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the posture and the pitch in degrees taken and the tipped posture returned with the hips shifted back to balance it.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    tip: (posture: IHumanPosture, pitch: number) => IHumanPosture;

    /**
     * The primitive that leans in by `ready`, follows the stroke's progress and straightens from `relax`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the clock it is built on and the primitive returned: leaning in by ready, following the stroke and straightening from relax.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    primitive: (
      clock: AutoMovieMotionClock.IClock,
    ) => IAutoMovieMotionHumanPrimitive;
  }

  /**
   * Solve the lean of a stroke.
   *
   * @param props The body, the standing posture, the hand, the share, the wrist's goal and the arm's.
   * @returns The lean.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result; the namespace states the movement.
   * @evidence contracts/development/implementation.md#principled-implementation The hips' shift at a pitch is the balance shift of the standing posture tipped there, lowered onto its legs and with the working arm on its goal, so the centre of mass stays where the unleaned body has it and moves no faster than the arm carries it (Hof et al. 2005's margin reads the centre's speed); it is solved at 5 degree steps and carried in proportion between, continuous in the pitch. The pitch is the least root of the wrist's distance beyond the kept share. That distance falls with the lean for a wrist below the shoulder and rises again for one above it, so the lean is scanned upward in 5 degree steps for the first pitch that reaches and bisected between it and the step before.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One balance solve per step of the pitch, one scan with its bisection, one primitive.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A wrist no scanned lean reaches throws with the smallest shortfall and the pitch that gives it; the leaned root is lowered until the planted legs reach their feet. A reach that opens and closes inside one 5 degree step is missed, the remaining gap; the shift between two steps of the pitch is their proportion, not a solve.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most nine scanned leans and nine halvings per read, to a hundredth of a degree; at most nine balance solves per plan, each made the first time a pitch needs its step and kept.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanLean.tip`, `HumanBalance.shift`, `AutoMovieMotionHumanReach.check` and `resolveHumanPosture.lower`; each step's balance shift is solved once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closes over the props, the held centre and at most ten solved shifts.
   */
  export function solve(props: IProps): ILean {
    // The step of the scan for the first pitch that reaches, degrees
    // (provisional: the measured distances change by a few millimetres per
    // five degrees near their least, so a reach is not stepped over).
    const SCAN: number = 5;
    // The step of the pitch the hips' shift is solved at, degrees
    // (provisional: the shift changes by a few millimetres per step, so the
    // proportion between two steps misplaces the centre by less).
    const KNOT: number = 5;
    const limit: number = AutoMovieMotionHumanReach.LEAN_LIMIT;
    const limb: "leftArm" | "rightArm" = `${props.side}Arm`;

    // The standing posture as the balance weighs it: lowered onto the
    // planted legs, the working arm on its goal.
    const weighed = (posture: IHumanPosture): IHumanPosture => {
      const lowered: IHumanPosture = {
        ...posture,
        root: resolveHumanPosture.lower(props.body, posture).root,
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
    // arm placed has it, so a pitch of 0 shifts nothing.
    const held: number = HumanBalance.offset(
      props.body,
      weighed(props.standing),
    );
    const steps: Map<number, number> = new Map();
    const step = (index: number): number => {
      let back: number | undefined = steps.get(index);
      if (back === undefined) {
        back =
          index === 0
            ? 0
            : HumanBalance.shift(
                props.body,
                (shift: number): IHumanPosture =>
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
              );
        steps.set(index, back);
      }
      return back;
    };
    // Between two steps the shift is carried in proportion, so it follows
    // the pitch continuously.
    const back = (pitch: number): number => {
      const at: number = Math.min(limit, Math.max(0, pitch)) / KNOT;
      const below: number = Math.floor(at);
      const share: number = at - below;
      return share === 0
        ? step(below)
        : step(below) * (1 - share) + step(below + 1) * share;
    };
    const tip = (posture: IHumanPosture, pitch: number): IHumanPosture =>
      AutoMovieMotionHumanLean.tip(props.body, posture, pitch, back(pitch));
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

      // The distance does not always fall with the lean: a wrist above the
      // shoulder comes nearer for the first degrees and moves away after,
      // as the shoulder drops. So the lean is scanned upward for the first
      // pitch that reaches, and the least pitch lies between it and the
      // sample before; a reach that opens and closes inside one step of the
      // scan is not found.
      let low: number = 0;
      let high: number | undefined;
      let nearest: { pitch: number; beyond: number } = {
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

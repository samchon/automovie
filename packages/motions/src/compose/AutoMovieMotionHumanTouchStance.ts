import { Vector3, bracketedBisection } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanLeanInto,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRange,
  IAutoMovieMotionHumanReach,
  IAutoMovieMotionHumanTouchStance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { HumanBalance } from "../everyday/HumanBalance";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanLean } from "./AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeanInto } from "./AutoMovieMotionHumanLeanInto";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanReach } from "./AutoMovieMotionHumanReach";
import { AutoMovieMotionHumanRise } from "./AutoMovieMotionHumanRise";

/**
 * What the body behind the arm does so a hand reaches a region its arm
 * alone does not: the shoulder girdle lifted and a rise onto the toes for a
 * region above the shoulder, then a lean from the hips for what is still
 * beyond the arm.
 *
 * A person reaching up to a taller person's face, or to a shelf, lifts the
 * shoulder with the arm (the scapula turns up as the arm is raised, Inman,
 * Saunders and Abbott 1944) and then raises the heels, because leaning
 * forward lowers the shoulder and takes it away from a place above it. Each
 * moves by the least angle that brings the wrist within the kept share of
 * the arm, and no further than the shoulder needs to come level with the
 * wrist or than its limit (`GIRDLE`, `RAISE`). What remains is leaned into
 * (`AutoMovieMotionHumanLeanInto`), which refuses a region still out of
 * reach at its limit.
 *
 * Risen, the body bears on its forefoot alone, so the hips carry the
 * whole-body centre of mass over it, kept clear of a partner standing
 * close, and that shift leads the heels by the least time that keeps the
 * extrapolated centre of mass inside the base (`AutoMovieMotionHumanRise.poise`),
 * as a person sways forward over the balls of the feet before rising.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two movements, their order, why the rise comes first, what bounds each and who refuses.
 * @evidence contracts/development/design.md#principled-representation A girdle angle, a heel angle and a lean solved once from the wrist's place on the posture, the body's three ways of closing a reach without a step.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two limits, the props, the solved stance and its solver; read by the touch law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wrist is the caller's own goal and the rise and the lean are their owners', so no region, effector or body is named here.
 */
export namespace AutoMovieMotionHumanTouchStance {
  /** The most the heels rise, degrees (provisional, the kiss law's limit: past it the foot stands on the toes' tips). */
  export const RAISE: number = 35;

  /** The share of the shoulder girdle's range of elevation a reach lifts it by at most (provisional: Inman, Saunders and Abbott 1944 give the scapula a third of the arm's elevation; the share was not read from a source). */
  export const GIRDLE: IAutoMovieMotionHumanRange.Level = "half";

  /**
   * Solve the stance of a stroke.
   *
   * @param props The body, the standing posture, the feet, the hand, the share and the wrist's goal.
   * @returns The stance.
   * @throws {HumanRefusal} When the wrist is beyond the kept share at the lean's limit, on the first read of the lean.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and the refusal; the namespace states the movements.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist's distance beyond the kept share falls monotonically while the shoulder rises toward the wrist's height, so the least girdle angle, then the least heel angle, is its bisected root; each is taken only for a wrist above the shoulder that it brings nearer, and the lean is solved on the risen posture. Risen, the hips' shift is the static balance on the raised feet's base (`HumanBalance.shift`), its centre moved back toward the forefoot's rear edge only as far as a partner's clearance needs (a bisection), and the shift and the heels are timed by the extrapolated centre's lead (`AutoMovieMotionHumanRise.poise`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The reach at a girdle and a heel angle, one rule for the least of either (`least`), the lean, the primitives.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A region the rise does not bring nearer keeps the heels down; nothing is clamped, the lean refuses what remains.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains every original girdle/heel endpoint, bisection and three-progress reach probe. One fixed shoulder demand serves them, and each three-progress operation shares exact FK prerequisites without full bone output. Runtime lean/lowering borrow current-person metadata; speedup is unmeasured. A rise adds one balance search and two timing readings a plan, and a partner too close for it one bisection of balance searches; no closed form places the whole body's centre over a changed base, and each is read once at plan time, never per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Rise, LeanInto and raw lowering retain their original owners; Reach.prepareCheck binds only static body/limb names. Every original wrist callback/check still executes in order with its current posture, while dynamic workspaces stay local to that reach/write.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned stance owns props, fixed solved angles/feet and lean metadata until release. Every three-progress FK getter and runtime loan releases on synchronous return or throw; no sampled root, pose, wrist or query history enters plan state.
   */
  export function solve(props: IAutoMovieMotionHumanTouchStance.IProps): IAutoMovieMotionHumanTouchStance.IStance {
    const { body, standing, feet } = props;
    const shoulder: "leftShoulder" | "rightShoulder" = `${props.side}Shoulder`;
    const checkReach: ReturnType<typeof AutoMovieMotionHumanReach.prepareCheck> =
      AutoMovieMotionHumanReach.prepareCheck(body, `${props.side}Arm`);

    // A posture with the working girdle lifted and the heels raised.
    const moved: (posture: IAutoMovieMotionHumanPosture, girdle: number, degrees: number) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      girdle: number,
      degrees: number,
    ): IAutoMovieMotionHumanPosture => {
      const was: readonly [number, number, number] = posture.joints[
        shoulder
      ] ?? [0, 0, 0];
      return {
        ...posture,
        root:
          feet === undefined || degrees === 0
            ? posture.root
            : Vector3.add(
                posture.root,
                AutoMovieMotionHumanRise.lift(body, feet, degrees),
              ),
        joints:
          girdle === 0
            ? posture.joints
            : {
                ...posture.joints,
                [shoulder]: [was[0], was[1] + girdle, was[2]],
              },
      };
    };

    // The worst of the stroke's start, middle and end on a posture: how far
    // the wrist lies beyond the kept share, and how far above the shoulder.
    const reach: (posture: IAutoMovieMotionHumanPosture) => IReach = (posture: IAutoMovieMotionHumanPosture): IReach => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
      let worst: IReach = { beyond: -Infinity, above: 0 };
      for (const progress of [0, 0.5, 1]) {
        const wrist: IAutoMovieVector3 = props.wrist(posture, progress);
        const check: IAutoMovieMotionHumanReach.ICheck =
          checkReach(
            posture,
            wrist,
            resolution,
          );
        const beyond: number = check.distance - props.share * check.length;
        if (beyond > worst.beyond)
          worst = { beyond, above: wrist.y - check.root.y };
      }
      return worst;
    };

    // The girdle first, as it rises with the arm, then the heels.
    const girdle: number = least(
      AutoMovieMotionHumanRange.degrees(shoulder, "abduction", GIRDLE),
      (degrees: number): IReach => reach(moved(standing, degrees, 0)),
    );
    const raise: number =
      feet === undefined
        ? 0
        : least(
            RAISE,
            (degrees: number): IReach =>
              reach(moved(standing, girdle, degrees)),
          );

    // On raised heels the body bears on the forefoot alone, so the hips
    // carry the whole-body centre of mass over it (`HumanBalance.shift` on
    // the base the raised feet bear on, the planted legs reaching their
    // raised feet from each trial's root). The shift leads the heels: it is
    // shown first, over `poise` seconds with the feet flat
    // (`AutoMovieMotionHumanRise.poise`), the heels rising after it, and on
    // the way back the heels come down before it returns. There is no
    // closed form for the whole body's centre over a changed base, so the
    // shift is the balance's one bracketed search, once a plan.
    const legged = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
    ): IAutoMovieMotionHumanPosture => {
      if (feet === undefined) return posture;
      const goal = (side: "left" | "right"): IAutoMovieHumanLimbGoal =>
        AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          side,
          AutoMovieMotionHumanRise.foot(body, side, feet[side], degrees),
          true,
        );
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
        ...posture.limbs,
        leftLeg: goal("left"),
        rightLeg: goal("right"),
      };
      return {
        ...posture,
        limbs,
        root: resolveHumanPosture.lower(body, { ...posture, limbs }).root,
      };
    };
    // The full rise with the hips shifted back by `back` metres.
    const stood = (back: number): IAutoMovieMotionHumanPosture =>
      legged(
        AutoMovieMotionHumanLean.tip(body, moved(standing, girdle, raise), 0, back),
        raise,
      );
    // The hips' shift that puts the centre `target` metres ahead of the
    // middle of the base the raised feet bear on.
    const balanced = (target: number): number =>
      HumanBalance.shift(body, stood, HumanBalance.RANGE, target);
    // The root is decided once from the balance and the people about it:
    // the centre over the middle of the forefoot, the place of the widest
    // margin, unless the hips would then pass into a partner standing close;
    // then the centre stands as near that middle as the hips keep clear (a
    // bisection over the centre's place back toward the forefoot's rear
    // edge, each with its balanced shift), the planner's own allowance into
    // a body being the clearance (half the skin the tangle audit allows).
    const rises: boolean = feet !== undefined && raise > 0;
    let forward: number = rises ? balanced(0) : 0;
    const clear: ((posture: IAutoMovieMotionHumanPosture) => number) | undefined = props.clear;
    if (rises && clear !== undefined && clear(stood(forward)) > CLEARANCE) {
      const rear: number = -HumanBalance.margin(body, stood(forward));
      const blocked = (target: number): boolean =>
        clear(stood(balanced(target))) > CLEARANCE;
      forward = balanced(
        blocked(rear)
          ? rear
          : bracketedBisection(blocked, 0, rear, HumanBalance.TOLERANCE),
      );
    }
    // The shift's seconds with the feet flat, both ways, and the heels'
    // least seconds on from there to the full rise.
    const shiftedFlat: IAutoMovieMotionHumanPosture = legged(
      AutoMovieMotionHumanLean.tip(body, standing, 0, forward),
      0,
    );
    const poise: number =
      forward === 0
        ? 0
        : AutoMovieMotionHumanRise.poise(body, legged(standing, 0), shiftedFlat, true);
    const rising: number =
      feet === undefined || raise === 0
        ? 0
        : AutoMovieMotionHumanRise.poise(
            body,
            shiftedFlat,
            stood(forward),
            false,
          );
    const risen: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.tip(
      body,
      moved(standing, girdle, raise),
      0,
      forward,
    );
    const lean: IAutoMovieMotionHumanLeanInto.ILean =
      AutoMovieMotionHumanLeanInto.solve({
        body,
        standing: risen,
        side: props.side,
        share: props.share,
        wrist: props.wrist,
        ...(props.arm === undefined ? {} : { arm: props.arm }),
        refuse: props.refuse,
      });
    const leaning: boolean = [0, 0.5, 1].some(
      (progress: number): boolean => lean.pitch(risen, progress) > 0,
    );
    const tipped: IAutoMovieMotionHumanPosture = lean.tip(risen, lean.pitch(risen, 0));
    const reached: IAutoMovieMotionHumanPosture = leaning
      ? { ...tipped, root: resolveHumanPosture.lower(body, tipped).root }
      : risen;
    return {
      girdle,
      raise,
      poise,
      rising,
      leaning,
      risen,
      reached,
      primitives: (
        clock: IAutoMovieMotionClock,
      ): IAutoMovieMotionHumanPrimitive[] => {
        if (girdle === 0 && raise === 0)
          return leaning ? [lean.primitive(clock)] : [];
        const share: (seconds: number) => number = (seconds: number): number =>
          clock.envelope(["start", "ready"], ["relax", "end"], seconds);
        // With a shift, it leads the heels by `poise` (`poised`, `unpoised`).
        const heels: (seconds: number) => number =
          poise === 0
            ? share
            : (seconds: number): number =>
                clock.envelope(["poised", "ready"], ["relax", "unpoised"], seconds);
        const shifted: (seconds: number) => number =
          poise === 0
            ? share
            : (seconds: number): number =>
                clock.envelope(["start", "poised"], ["unpoised", "end"], seconds);
        return [
          {
            channels: raise > 0 || leaning ? ["root", "trunk"] : ["trunk"],
            from: 0,
            to: clock.duration,
            write: (posture: IAutoMovieMotionHumanPosture, seconds: number,
              _before?: IAutoMovieMotionHumanPrimitive.Reader,
              resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieMotionHumanPosture => {
              const k: number = share(seconds);
              const lift: number = heels(seconds);
              const up: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.tip(
                body,
                moved(posture, girdle * k, raise * lift),
                0,
                forward * shifted(seconds),
              );

              // The lean is read at the full rise, so its angle does not
              // change with the share of the rise shown.
              const leaned: IAutoMovieMotionHumanPosture = leaning
                ? lean.tip(
                    up,
                    k *
                      lean.pitch(
                        moved(posture, girdle, raise),
                        clock.progress("strokeStart", "strokeEnd", seconds),
                        resolution,
                      ),
                  )
                : up;
              if (feet === undefined || raise === 0)
                return leaning
                  ? {
                      ...leaned,
                      root: resolveHumanPosture.lower(body, leaned, undefined, resolution).root,
                    }
                  : leaned;

              // The planted legs reach their raised feet from the root the
              // rise and the lean leave.
              const goal: (side: "left" | "right") => IAutoMovieHumanLimbGoal = (side: "left" | "right"): IAutoMovieHumanLimbGoal =>
                AutoMovieMotionHumanLeg.goal(
                  body,
                  leaned,
                  side,
                  AutoMovieMotionHumanRise.foot(
                    body,
                    side,
                    feet[side],
                    raise * lift,
                  ),
                  true,
                );
              return {
                ...leaned,
                root: resolveHumanPosture.lower(body, {
                  ...leaned,
                  limbs: {
                    ...leaned.limbs,
                    leftLeg: goal("left"),
                    rightLeg: goal("right"),
                  },
                }, undefined, resolution).root,
              };
            },
          },
          ...(feet === undefined || raise === 0
            ? []
            : AutoMovieMotionHumanRise.legs({
                body,
                stance: feet,
                from: 0,
                to: clock.duration,
                degrees: (seconds: number): number => raise * heels(seconds),
              })),
        ];
      },
    };
  }
}

/** How deep the body may pass into a person about it, metres: half the skin the tangle audit allows, the arm planner's own allowance (`HumanArmTrajectoryTerms.DEPTH`). */
const CLEARANCE: number = AutoMovieMotionHumanAuditSkin.BUILT / 2;

/** A wrist's place against the arm on a posture, metres: beyond the kept share of the arm's length, and above the shoulder joint. */
interface IReach {
  /** How far the wrist lies beyond the kept share; not positive within it. */
  beyond: number;

  /** How far the wrist lies above the shoulder joint; negative below it. */
  above: number;
}

/**
 * The least angle of one freedom that closes a reach upward, degrees: 0 when
 * the wrist is within the share, not above the shoulder, or no nearer at the
 * limit; the limit when even it leaves the wrist beyond the share and above
 * the shoulder; otherwise the bisected angle at which the wrist comes within
 * the share, or, when the limit does not bring it there, at which the
 * shoulder comes level with the wrist, since above that the freedom would
 * take the shoulder away again.
 */
function least(limit: number, at: (degrees: number) => IReach): number {
  const none: IReach = at(0);
  if (!(none.beyond > 0 && none.above > 0)) return 0;
  const top: IReach = at(limit);
  if (!(top.beyond < none.beyond)) return 0;
  const enough: (reach: IReach) => boolean = (reach: IReach): boolean =>
    top.beyond <= 0 ? reach.beyond <= 0 : reach.above <= 0;
  if (!enough(top)) return limit;
  let low: number = 0;
  let high: number = limit;
  while (high - low > 0.01) {
    const middle: number = (low + high) / 2;
    if (enough(at(middle))) high = middle;
    else low = middle;
  }
  return high;
}

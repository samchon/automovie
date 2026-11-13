import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanLeanInto } from "./AutoMovieMotionHumanLeanInto";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanReach } from "./AutoMovieMotionHumanReach";
import { AutoMovieMotionHumanRise } from "./AutoMovieMotionHumanRise";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

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
 * @evidence contracts/development/common.md#meaningful-documentation States the two movements, their order, why the rise comes first, what bounds each and who refuses.
 * @evidence contracts/development/design.md#principled-representation A girdle angle, a heel angle and a lean solved once from the wrist's place on the posture, the body's three ways of closing a reach without a step.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two limits, the props, the solved stance and its solver; read by the touch law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wrist is the caller's own goal and the rise and the lean are their owners', so no region, effector or body is named here.
 */
export namespace AutoMovieMotionHumanTouchStance {
  /** The most the heels rise, degrees (provisional, the kiss law's limit: past it the foot stands on the toes' tips). */
  export const RAISE: number = 35;

  /** The share of the shoulder girdle's range of elevation a reach lifts it by at most (provisional: Inman, Saunders and Abbott 1944 give the scapula a third of the arm's elevation; the share was not read from a source). */
  export const GIRDLE: AutoMovieMotionHumanRange.Level = "half";

  /**
   * What a stance is solved from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and the meaning of its absence.
   * @evidence contracts/development/design.md#principled-representation The body, the posture it stands in, the feet it may rise on, the arm, the share of its length kept and the wrist's goal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, all read by `solve`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The feet are optional because a seated or carried body has none to rise on; the refusal's words are the caller's.
   */
  export interface IProps {
    /** The body. */
    body: IHumanBody;

    /** The posture the body stands in before it rises or leans. */
    standing: IHumanPosture;

    /** Both feet as they stand flat, when the body stands on them alone and may rise onto its toes; no rise when absent. */
    feet?: AutoMovieMotionHumanRise.Stance;

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
   * A solved stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds and its unit.
   * @evidence contracts/development/design.md#principled-representation The girdle and heel angles, whether the trunk leans, the posture at the full rise and the primitives that perform them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members; the touch law reads the lean, the risen posture and the primitives, and its tests the two angles.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The primitives are built on the caller's clock, so the body moves on the hand's envelope.
   */
  export interface IStance {
    /** The working shoulder girdle's elevation at the region, degrees; 0 when it stays down. */
    girdle: number;

    /** The heels' raise at the region, degrees; 0 when the body does not rise. */
    raise: number;

    /** Whether the trunk leans from the hips at some progress of the stroke. */
    leaning: boolean;

    /** The standing posture with the girdle lifted by `girdle` and risen by `raise`, before any lean: the posture the arm's hint and reference are solved on. */
    risen: IHumanPosture;

    /** The primitives that rise and lean by `ready`, follow the stroke and come back from `relax`: none when the arm reaches as it stands. */
    primitives: (
      clock: AutoMovieMotionClock.IClock,
    ) => IAutoMovieMotionHumanPrimitive[];
  }

  /**
   * Solve the stance of a stroke.
   *
   * @param props The body, the standing posture, the feet, the hand, the share and the wrist's goal.
   * @returns The stance.
   * @throws {HumanRefusal} When the wrist is beyond the kept share at the lean's limit, on the first read of the lean.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and the refusal; the namespace states the movements.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist's distance beyond the kept share falls monotonically while the shoulder rises toward the wrist's height, so the least girdle angle, then the least heel angle, is its bisected root; each is taken only for a wrist above the shoulder that it brings nearer, and the lean is solved on the risen posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The reach at a girdle and a heel angle, one rule for the least of either (`least`), the lean, the primitives.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A region the rise does not bring nearer keeps the heels down; nothing is clamped, the lean refuses what remains.
   * @evidence contracts/development/implementation.md#efficient-algorithms Twelve halvings of three reach checks each per freedom, once per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanRise`, `AutoMovieMotionHumanLeanInto`, `AutoMovieMotionHumanReach.check` and `resolveHumanPosture.lower`; a stance that does not rise returns the lean's own primitive.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closes over the props, the heel angle and the lean.
   */
  export function solve(props: IProps): IStance {
    const { body, standing, feet } = props;
    const shoulder: "leftShoulder" | "rightShoulder" = `${props.side}Shoulder`;

    // A posture with the working girdle lifted and the heels raised.
    const moved = (
      posture: IHumanPosture,
      girdle: number,
      degrees: number,
    ): IHumanPosture => {
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
    const reach = (posture: IHumanPosture): IReach => {
      let worst: IReach = { beyond: -Infinity, above: 0 };
      for (const progress of [0, 0.5, 1]) {
        const wrist: IAutoMovieVector3 = props.wrist(posture, progress);
        const check: AutoMovieMotionHumanReach.ICheck =
          AutoMovieMotionHumanReach.check(
            body,
            posture,
            `${props.side}Arm`,
            wrist,
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

    const risen: IHumanPosture = moved(standing, girdle, raise);
    const lean: AutoMovieMotionHumanLeanInto.ILean =
      AutoMovieMotionHumanLeanInto.solve({
        body,
        standing: risen,
        side: props.side,
        share: props.share,
        wrist: props.wrist,
        refuse: props.refuse,
      });
    const leaning: boolean = [0, 0.5, 1].some(
      (progress: number): boolean => lean.pitch(risen, progress) > 0,
    );
    return {
      girdle,
      raise,
      leaning,
      risen,
      primitives: (
        clock: AutoMovieMotionClock.IClock,
      ): IAutoMovieMotionHumanPrimitive[] => {
        if (girdle === 0 && raise === 0)
          return leaning ? [lean.primitive(clock)] : [];
        const share = (seconds: number): number =>
          clock.envelope(["start", "ready"], ["relax", "end"], seconds);
        return [
          {
            channels: raise > 0 || leaning ? ["root", "trunk"] : ["trunk"],
            from: 0,
            to: clock.duration,
            write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
              const k: number = share(seconds);
              const up: IHumanPosture = moved(posture, girdle * k, raise * k);

              // The lean is read at the full rise, so its angle does not
              // change with the share of the rise shown.
              const leaned: IHumanPosture = leaning
                ? lean.tip(
                    up,
                    k *
                      lean.pitch(
                        moved(posture, girdle, raise),
                        clock.progress("strokeStart", "strokeEnd", seconds),
                      ),
                  )
                : up;
              if (feet === undefined || raise === 0)
                return leaning
                  ? {
                      ...leaned,
                      root: resolveHumanPosture.lower(body, leaned).root,
                    }
                  : leaned;

              // The planted legs reach their raised feet from the root the
              // rise and the lean leave.
              const goal = (side: "left" | "right"): IHumanPosture.IGoal =>
                AutoMovieMotionHumanLeg.goal(
                  body,
                  leaned,
                  side,
                  AutoMovieMotionHumanRise.foot(
                    body,
                    side,
                    feet[side],
                    raise * k,
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
                }).root,
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
                degrees: (seconds: number): number => raise * share(seconds),
              })),
        ];
      },
    };
  }
}

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
  const enough = (reach: IReach): boolean =>
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

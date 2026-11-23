import {
  ROM_TOLERANCE,
  getConstraint,
  hingedArmSwivel,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountPush } from "./HumanMountPush";

/**
 * A leg swung over a seat in joint space: the leg's fitted joints where it
 * leaves, where it lands and at the swing's middle, and the curve through them,
 * for a swing whose world course leaves the leg's range. A world course for a
 * leg swung over a saddle or a frame asks the ankle above and behind the hip,
 * past what the hip's extension and abduction let the leg reach, so the limb
 * fit pins the leg at its range and then drops to its numerical refinement, its
 * knee flipping as it leaves and returns to the closed form. Keyed in the
 * joints instead, as a swing is keyed in animation, the leg passes the middle
 * where the fit of the world course put it, the nearest pose the range allows,
 * and every pose between the keys stays inside the range by construction. The
 * swing is keyed from the frame its foot has lifted off the floor to the
 * landing: a window opened where the course first reaches the range takes its
 * first key from a course already bent the wrong way (a knee lifted ahead under
 * a foot that is to pass behind), and seams the leg there. Up to the lift-off
 * the world course is shown and the landing key is the law's own landing pose,
 * so the foot still lifts off and lands as the law sets it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the keys are, why a world course fails and what the joint curve keeps.
 * @evidence contracts/development/design.md#principled-representation Clinical joint angles of one leg's bones, degrees, the posture's own joint record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The keys and the curve, read by `HumanMountOn` and `HumanMountOff`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every key is a fit of the law's own posture; no seat or body is named.
 */
export namespace HumanSwungLeg {
  /**
   * One leg's joints by bone, clinical degrees `[flexion, abduction, twist]`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the record and its unit.
   * @evidence contracts/development/design.md#principled-representation The posture's own joint record, so a key drops into a posture unchanged.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The keys' and the curve's record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture's type rather than restating it.
   */
  export type Joints = IAutoMovieMotionHumanPosture["joints"];

  /**
   * A leg's swing on its action's clock: the seconds it leaves and lands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both ends and their timebase.
   * @evidence contracts/development/design.md#principled-representation Two action seconds, the leave before the landing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `plan` asks of each leg.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A leg that does not swing has no swing (null), not an empty one.
   */
  export type Swing = readonly [number, number];

  /**
   * A plan whose swinging legs are keyed in joint space where their world
   * course leaves the leg's range: over that swing (`window`) each such leg's
   * world goal gives way to the joints `at` reads between its keys, found once
   * a leg, at the minimum-jerk share of the swing (Flash and Hogan 1985), so
   * the leg leaves and lands at rest in its joints as the world course leaves
   * and lands at rest on its feet; elsewhere the plan's posture is returned as
   * it was.
   *
   * @param body The body.
   * @param plan The plan, its legs on their world goals.
   * @param swingOf Each leg's swing, or null for a leg that does not swing.
   * @returns The plan with the swinging legs keyed where they must be.
   * @evidence contracts/development/common.md#meaningful-documentation States what is replaced, inside which window and what is found once.
   * @evidence contracts/development/implementation.md#principled-implementation The keys are fits of the plan's own posture at the window's ends, so the posture just outside the window equals the keyed one at them; inside it the joint curve stands in for a world goal the leg cannot reach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrapper over the plan's posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside a window the plan's posture is returned as it was.
   * @evidence contracts/development/implementation.md#efficient-algorithms One scan of a swing per leg and plan (`window`); constant work a read after.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The window and its keys are kept per leg for the plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains at most two key sets, released with the plan.
   */
  export function plan(
    body: IAutoMovieMotionHumanBody,
    plan: IAutoMovieMotionHumanActionPlan,
    swingOf: (side: AutoMovieHumanSide) => Swing | null,
  ): IAutoMovieMotionHumanActionPlan {
    const kept: Map<AutoMovieHumanSide, IKeys | null> = new Map();
    return {
      ...plan,
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(plan.duration, Math.max(0, seconds));
        let out: IAutoMovieMotionHumanPosture = plan.posture(
          seconds,
          channels,
          resolution,
          projection,
        );
        for (const side of ["left", "right"] as const) {
          const swing: Swing | null = swingOf(side);
          if (swing === null || !(t > swing[0] && t < swing[1])) continue;
          if (!kept.has(side))
            kept.set(
              side,
              window(
                body,
                side,
                (at: number): IAutoMovieMotionHumanPosture => plan.posture(at),
                swing,
              ),
            );
          const found: IKeys | null = kept.get(side)!;
          if (found === null || !(t > found.start && t < found.end)) continue;
          const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
            ...out.limbs,
          };
          delete limbs[`${side}Leg`];
          out = {
            ...out,
            joints: {
              ...out.joints,
              ...at(
                body,
                found,
                minimumJerk.share(
                  (t - found.start) / (found.end - found.start),
                ),
              ),
            },
            limbs,
          };
        }
        return out;
      },
    };
  }

  /**
   * A swung leg's keys over a swing whose world course leaves the range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the window and each key.
   * @evidence contracts/development/design.md#principled-representation The leg's joints at the window's two ends and its middle, with the window in action seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `window`, read by `at` and `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each key holds the same bones, those the fit returned for the leg.
   */
  export interface IKeys {
    /** The second the window opens, action seconds. */
    start: number;

    /** The second the window closes, action seconds. */
    end: number;

    /** The joints where the window opens. */
    from: Joints;

    /** The joints at the window's middle. */
    apex: Joints;

    /** The joints where the window closes. */
    to: Joints;
  }

  /**
   * The keys of a swing whose world course leaves the leg's range. The swing is
   * fitted on the frame grid (`STEP`), its first frame cold and each later one
   * continuing the frame before, as a display continues a free leg; a frame
   * whose hip or knee lies within `EDGE` of a bound is pinned there. A swing
   * with a pinned frame is keyed from its first frame whose sole sockets all
   * stand higher than `HumanFoot.BEARING` above the lowest the foot left from
   * (the audit's own reading of a foot on the floor), or from the frame before
   * the first pinned one if that comes earlier, to the landing, and its keys
   * are the fits at its ends and at its middle: the start is the pose shown as
   * the foot comes off; the landing is fitted as the display fits it, its own
   * fit on a plant or a contact and the continued one otherwise; and the middle
   * is the nearest legal pose to the world course.
   *
   * @param body The body.
   * @param side The leg.
   * @param asked The law's posture at a second, its leg on its world goal.
   * @param swing The seconds the leg leaves and lands.
   * @returns The keys, or null where no frame is pinned.
   * @evidence contracts/development/common.md#meaningful-documentation States the scan, the pin test, the window and the keys.
   * @evidence contracts/development/implementation.md#principled-implementation The fits are the shared resolver's, continued frame to frame as the display's leg chain is (Tolani, Goswami and Badler 2000, section 3.2.4), so the ends are the poses shown outside the window; a fit held at a bound is the resolver's projection of a goal past it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan, one test, three keys.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `EDGE` is a named reading tolerance; nothing is tuned to a case.
   * @evidence contracts/development/implementation.md#efficient-algorithms One continued fit and one forward-kinematics pass a frame of the swing, made once per leg and plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The caller keeps the keys for its plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function window(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    asked: (seconds: number) => IAutoMovieMotionHumanPosture,
    swing: Swing,
  ): IKeys | null {
    const limb: AutoMovieHumanLimb = `${side}Leg`;
    let seed: IAutoMovieSwivelSeed | null | undefined;
    // The lowest of each fitted frame's sole sockets, world metres.
    const lows: number[] = [];
    const fitted = (seconds: number): Joints => {
      const near: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> =
        seed === undefined || seed === null
          ? {}
          : { [limb]: { ...seed, tolerance: hingedArmSwivel.RESOLUTION } };
      const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        resolveHumanPosture.seeded(body, asked(seconds), undefined, near);
      seed = solved.seeds[limb];
      lows.push(
        Math.min(
          ...HumanFoot.sockets(body, poseBones(body, solved.pose), side).map(
            (socket: IAutoMovieMotionHumanFoot.ISocket): number =>
              socket.point.y,
          ),
        ),
      );
      const out: Joints = {};
      for (const joint of solved.pose.joints)
        if (BONES[side].includes(joint.bone))
          out[joint.bone] = [
            joint.flexion ?? 0,
            joint.abduction ?? 0,
            joint.twist ?? 0,
          ];
      return out;
    };
    const times: number[] = [];
    for (let t: number = swing[0]; t < swing[1]; t += STEP) times.push(t);
    times.push(swing[1]);
    const fits: Joints[] = times.map(fitted);
    const pinned: boolean[] = fits.map((joints: Joints): boolean =>
      BONES[side].some((bone: AutoMovieHumanoidBone): boolean =>
        [0, 1, 2].some((axis: number): boolean => {
          const value: number | undefined = joints[bone]?.[axis];
          if (value === undefined || !PINNED.has(bone)) return false;
          const [low, high]: readonly [number, number] = bounds(
            body,
            bone,
            axis,
          );
          // An immobile axis holds no range to leave, and a straight knee
          // is the leg at its reach, not past its range.
          if (!(high > low)) return false;
          return (
            (value <= low + EDGE && !bone.endsWith("LowerLeg")) ||
            value >= high - EDGE
          );
        }),
      ),
    );
    // A course that leaves the range anywhere is keyed from the frame its
    // foot has lifted off the floor it left, every sole socket higher than
    // the audit reads on it (`HumanFoot.BEARING`), to the landing: a joint
    // curve from the leave itself would slide the sole still on the floor,
    // and a window opened later, where the course first reaches the range,
    // would take its first key from a course already bent the wrong way.
    const pinnedAt: number = pinned.indexOf(true);
    if (pinnedAt < 0) return null;
    const lifted: number = lows.findIndex(
      (low: number): boolean => low - lows[0]! > HumanFoot.BEARING,
    );
    const open: number = Math.min(
      lifted < 0 ? pinnedAt : lifted,
      Math.max(0, pinnedAt - 1),
    );
    const start: number = times[open]!;
    const end: number = swing[1];
    if (!(end > start)) return null;
    // A leg landing on a plant or a contact keeps its own fit there, as a
    // display shows it; a leg landing free continues its chain.
    const landed: IAutoMovieHumanLimbGoal | undefined = asked(end).limbs[limb];
    const planted: boolean =
      landed?.planted === true || landed?.contact !== undefined;
    seed = undefined;
    const apex: Joints = fitted((start + end) / 2);
    seed = undefined;
    return {
      start,
      end,
      from: fits[open]!,
      apex,
      to: planted ? fitted(end) : fits[fits.length - 1]!,
    };
  }

  /**
   * The leg's joints a share of the way through its window: each angle on the
   * quadratic through the three keys, `from + (to - from) s + 4 s (1 - s) (apex
   * - (from + to) / 2)`, held within its range of motion, and a foot that bears
   * nothing held within the unloaded ankle's dorsal range
   * (`HumanMountPush.DORSAL`) unless an end key itself bends it further.
   *
   * @param body The body, whose joint ranges are read.
   * @param keys The keys.
   * @param share 0 where the window opens to 1 where it closes.
   * @returns The joints.
   * @evidence contracts/development/common.md#meaningful-documentation States the curve, the bounds and the share.
   * @evidence contracts/development/implementation.md#principled-implementation The quadratic meets each key exactly (s = 0, 1/2, 1), as `HumanMount.between`'s course passes its middle; the range clamp is continuous, so the curve stays continuous where it touches a bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression per angle, one clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bounds are the range table's and the unloaded ankle's; the foot's bound yields to an end key that is loaded, so no end jumps.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per bone.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    body: IAutoMovieMotionHumanBody,
    keys: IKeys,
    share: number,
  ): Joints {
    const s: number = Math.min(1, Math.max(0, share));
    const out: Joints = {};
    for (const bone of [...BONES.left, ...BONES.right]) {
      const from: readonly [number, number, number] | undefined =
        keys.from[bone];
      const to: readonly [number, number, number] | undefined = keys.to[bone];
      const apex: readonly [number, number, number] | undefined =
        keys.apex[bone];
      if (from === undefined || to === undefined || apex === undefined)
        continue;
      const angle = (axis: 0 | 1 | 2): number => {
        const value: number =
          from[axis] +
          (to[axis] - from[axis]) * s +
          4 * s * (1 - s) * (apex[axis] - (from[axis] + to[axis]) / 2);
        const [low, bound]: readonly [number, number] = bounds(
          body,
          bone,
          axis,
        );
        const high: number =
          axis === 0 && FEET.has(bone)
            ? Math.min(bound, Math.max(HumanMountPush.DORSAL, from[0], to[0]))
            : bound;
        return Math.min(high, Math.max(low, value));
      };
      out[bone] = [angle(0), angle(1), angle(2)];
    }
    return out;
  }

  /**
   * A joint axis's range, degrees: the range table's, zero for an immobile
   * axis, open for an unconstrained one.
   */
  function bounds(
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
    axis: number,
  ): readonly [number, number] {
    const constraint: IAutoMovieJointConstraint | null = getConstraint(
      bone,
      readHumanBone(body, bone)?.constraint ?? null,
    );
    const range: IAutoMovieAngleRange | null | undefined =
      constraint === null ? undefined : constraint[AXES[axis]!];
    if (range === null) return [0, 0];
    return [range?.min ?? -Infinity, range?.max ?? Infinity];
  }

  /**
   * The frame grid a swing is scanned on, seconds: the display leg chain's
   * (`AutoMovieMotionHumanArmCourse.STEP`).
   */
  const STEP: number = AutoMovieMotionHumanArmCourse.STEP;

  /**
   * How near a bound a fitted angle reads as pinned there, degrees: a tenth of
   * a degree, ten times the range table's own tolerance (`ROM_TOLERANCE`), so a
   * fit projected onto a bound is caught.
   */
  const EDGE: number = 10 * ROM_TOLERANCE;

  /** A leg's bones, hip to toes. */
  const BONES: Record<AutoMovieHumanSide, readonly AutoMovieHumanoidBone[]> = {
    left: ["leftUpperLeg", "leftLowerLeg", "leftFoot", "leftToes"],
    right: ["rightUpperLeg", "rightLowerLeg", "rightFoot", "rightToes"],
  };

  /**
   * The hips and the knees: a fit held at their range has left the knee's
   * closed form, where an ankle held at its range only misses the foot's turn.
   */
  const PINNED: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      "leftUpperLeg",
      "leftLowerLeg",
      "rightUpperLeg",
      "rightLowerLeg",
    ]);

  /** The feet, whose flexion the unloaded ankle bounds. */
  const FEET: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(["leftFoot", "rightFoot"]);

  /** The clinical axes in a joint record's order. */
  const AXES: readonly ["flexion", "abduction", "twist"] = [
    "flexion",
    "abduction",
    "twist",
  ];
}

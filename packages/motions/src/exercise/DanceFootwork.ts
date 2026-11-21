import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The footwork every keyed dance law shares (#3991's tap and ballet,
 * #4010's street steps): each foot runs through its keys, dwelling at a
 * key from its arrival to its departure and travelling to the next key
 * between, lifted by that key's clearance on minimum-jerk progress (zero
 * clearance slides it along the floor, as a moonwalk's backslide). A
 * bearing dwell is a contact window: a plant, or a pivot when the key turns
 * the foot as it dwells (a pirouette's demi-pointe). The hips are carried
 * by the caller's world path and heading; the root follows them. A whole
 * course composes into a plan (compose).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the dwell and travel rule, the contacts and the carriage.
 * @evidence contracts/development/design.md#principled-representation Foot keys as data over one leg-placement row per foot and one carriage row.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The foot reader and the carriage row.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every placement and timing is the caller's; nothing is clamped.
 */
export namespace DanceFootwork {
  /** One foot's course: its leg row, its bearing windows and its placement reader. */
  export interface IFoot {
    /** The leg row placing the foot. */
    primitive: IAutoMovieMotionHumanPrimitive;

    /** The bearing dwells as contact windows. */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /**
     * The foot's placement at an action second.
     *
     * @param seconds Action seconds.
     * @returns The placement.
     */
    placed(seconds: number): IAutoMovieMotionHumanFoot.IPlacement;
  }

  /**
   * One foot's course through its keys.
   *
   * @param body The dancer's body.
   * @param side Which foot.
   * @param keys The keys in time order; the first arrives at 0.
   * @param duration The action's seconds.
   * @param support What a bearing foot stands on.
   * @returns The leg row, the contacts and the placement reader.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the three outputs.
   * @evidence contracts/development/implementation.md#principled-implementation Dwell at a key, travel to the next on a lifted minimum-jerk arc; a bearing dwell is planted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Lookup, dwell or travel, contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keys out of order are the caller's error and are not sorted.
   * @evidence contracts/development/implementation.md#efficient-algorithms A binary search over the keys per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared leg placement and arc rows.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the keys.
   */
  export function foot(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    keys: readonly IAutoMovieMotionHumanDanceFootKey[],
    duration: number,
    support: IAutoMovieMotionHumanContactWindow["support"],
  ): IFoot {
    function dwelt(
      key: IAutoMovieMotionHumanDanceFootKey,
      t: number,
    ): IAutoMovieMotionHumanFoot.IPlacement {
      return key.hold === undefined ? key.place : key.hold(t);
    }
    function placed(t: number): IAutoMovieMotionHumanFoot.IPlacement {
      const i: number = last(keys, t);
      const key: IAutoMovieMotionHumanDanceFootKey = keys[i]!;
      if (t <= key.leave || i + 1 >= keys.length)
        return dwelt(key, Math.min(t, key.leave));
      const next: IAutoMovieMotionHumanDanceFootKey = keys[i + 1]!;
      const u: number = (t - key.leave) / Math.max(1e-9, next.at - key.leave);
      return AutoMovieMotionHumanLeg.arc(
        dwelt(key, key.leave),
        dwelt(next, next.at),
        next.clearance,
        minimumJerk.share(Math.min(1, Math.max(0, u))),
      );
    }
    function planted(t: number): boolean {
      const key: IAutoMovieMotionHumanDanceFootKey = keys[last(keys, t)]!;
      return key.bears && t >= key.at && t <= key.leave;
    }
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    for (const key of keys)
      if (key.bears && key.leave > key.at)
        contacts.push({
          part: `${side}Foot`,
          kind: key.hold === undefined ? "plant" : "pivot",
          from: Math.max(0, key.at / duration),
          to: Math.min(1, key.leave / duration),
          support,
        });
    return {
      primitive: AutoMovieMotionHumanLeg.place({
        body,
        side,
        from: 0,
        to: duration,
        placement: (
          _: IAutoMovieMotionHumanPosture,
          t: number,
        ): IAutoMovieMotionHumanFoot.IPlacement => placed(t),
        planted,
      }),
      contacts,
      placed,
    };
  }

  /**
   * The carriage row: the hips on the caller's world path and heading, the
   * root back-solved from them, and the caller's joints written over.
   *
   * @param body The dancer's body.
   * @param duration The action's seconds.
   * @param hips The hips' world point at an action second.
   * @param yaw The heading at an action second, degrees.
   * @param joints The joints written at an action second; those of the legs are left to the feet's rows.
   * @returns The row.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the row writes.
   * @evidence contracts/development/implementation.md#principled-implementation The root is the hips less the rest hips turned by the heading, so the hips land where asked.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No smoothing of the caller's path.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The posture's heading reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the callbacks.
   */
  export function carry(
    body: IAutoMovieMotionHumanBody,
    duration: number,
    hips: (seconds: number) => IAutoMovieVector3,
    yaw: (seconds: number) => number,
    joints: (seconds: number) => IAutoMovieMotionHumanPosture["joints"],
  ): IAutoMovieMotionHumanPrimitive {
    const rest: IAutoMovieVector3 = body.rest.get("hips")!;
    return {
      channels: ["root", "trunk", "head", "leftArm", "rightArm"],
      reads: ["root", "trunk"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        t: number,
      ): IAutoMovieMotionHumanPosture => {
        const turned: IAutoMovieMotionHumanPosture = {
          ...posture,
          yaw: yaw(t),
          joints: { ...posture.joints, ...above(joints(t)) },
        };
        return {
          ...turned,
          root: Vector3.subtract(
            hips(t),
            Quaternion.rotateVector(resolveHumanPosture.heading(turned), rest),
          ),
        };
      },
    };
  }

  /**
   * Compose a keyed dance's course into its plan: both feet's rows and
   * contacts, the carriage row, and the clock of its instants.
   *
   * @param body The dancer's body.
   * @param entry The entry posture, the plan's base.
   * @param course The course.
   * @param support What a bearing foot stands on.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and what the plan holds.
   * @evidence contracts/development/implementation.md#principled-implementation The feet's rows and the carriage over the entry base.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Feet, carriage, clock, plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every placement and instant is the course's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work beyond the rows'.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one composition for every keyed dance law.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the course.
   */
  export function compose(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
    course: IAutoMovieMotionHumanDanceCourse,
    support: IAutoMovieMotionHumanContactWindow["support"],
  ): IAutoMovieMotionHumanActionPlan {
    const left: IFoot = foot(
      body,
      "left",
      course.left,
      course.duration,
      support,
    );
    const right: IFoot = foot(
      body,
      "right",
      course.right,
      course.duration,
      support,
    );
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(course.duration, entry, [
        ...left.contacts,
        ...right.contacts,
      ]),
      clock: AutoMovieMotionClock.of(course.duration, course.instants),
      primitives: [
        carry(body, course.duration, course.hips, course.yaw, course.joints),
        left.primitive,
        right.primitive,
      ],
    });
  }

  /** The joints above the hips: the legs are the feet's rows'. */
  function above(
    joints: IAutoMovieMotionHumanPosture["joints"],
  ): IAutoMovieMotionHumanPosture["joints"] {
    return Object.fromEntries(
      Object.entries(joints).filter(
        ([bone]: [string, unknown]): boolean => !LEGS.test(bone),
      ),
    );
  }

  /** The bones the leg rows own. */
  const LEGS: RegExp = /Leg|Foot|Toes|hips/;

  /** The last key arrived by a second (the first when none has). */
  function last(
    keys: readonly IAutoMovieMotionHumanDanceFootKey[],
    t: number,
  ): number {
    let lo: number = 0;
    let hi: number = keys.length - 1;
    while (lo < hi) {
      const mid: number = (lo + hi + 1) >> 1;
      if (keys[mid]!.at <= t) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }
}

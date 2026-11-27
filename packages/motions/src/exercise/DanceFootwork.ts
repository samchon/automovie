import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanFootRelax } from "../compose/AutoMovieMotionHumanFootRelax";
import { AutoMovieMotionHumanFootSwing } from "../compose/AutoMovieMotionHumanFootSwing";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanToesOnFloor } from "../compose/AutoMovieMotionHumanToesOnFloor";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanFoot } from "../posture/HumanFoot";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { pelvisReachHeight } from "../posture/internal/pelvisReachHeight";

/** The alternatives of `OverCourse`'s site. */
type OverCourse = "duration" | "left" | "right" | "yaw";

/**
 * The footwork every keyed dance law shares (tap and ballet, street steps):
 * each foot runs through its keys, dwelling at a key from its arrival to its
 * departure and travelling to the next key between on minimum-jerk progress,
 * lifted by that key's clearance: from one bearing key to another on a half
 * sine of the swing's time, so it lifts before it travels and lands after it
 * stops (`AutoMovieMotionHumanFootSwing`), otherwise on that progress (zero
 * clearance slides it along the floor, as a moonwalk's backslide). A bearing
 * dwell is a contact window: a plant, or a pivot when the key turns the foot as
 * it dwells (a pirouette's demi-pointe). The hips are carried by the caller's
 * world path and heading; the root follows them. A whole course composes into a
 * plan (compose).
 */
export namespace DanceFootwork {
  /**
   * How long either side of a brush its strike touches the floor, seconds
   * (provisional).
   */
  export const BRUSH: number = 0.03;

  /**
   * One foot's course: its leg row, its bearing windows and its placement
   * reader.
   */
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
      // A travel that lands on a bearing place (a step from another, or a
      // gesture closing to the floor) lifts before it travels and lands after
      // it stops; a brush or a gesture grazes the floor in passing, so its
      // rise follows the travel's own share, and a slide keeps to the floor.
      return next.bears && next.clearance > 0
        ? AutoMovieMotionHumanFootSwing(
            body,
            side,
            dwelt(key, key.leave),
            dwelt(next, next.at),
            next.clearance,
            u,
          )
        : AutoMovieMotionHumanLeg.arc(
            dwelt(key, key.leave),
            dwelt(next, next.at),
            next.clearance,
            AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, u))),
          );
    }
    function gesture(t: number): boolean {
      const key: IAutoMovieMotionHumanDanceFootKey = keys[last(keys, t)]!;
      return (
        !key.bears && key.hold !== undefined && t >= key.at && t <= key.leave
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
      // A brush touches the floor in passing: a strike, not a plant.
      else if (!key.bears && key.leave === key.at && key.clearance > 0)
        contacts.push({
          part: `${side}Foot`,
          kind: "strike",
          from: Math.max(0, (key.at - BRUSH) / duration),
          to: Math.min(1, (key.at + BRUSH) / duration),
          support,
        });
    // A travel with no clearance keeps the foot on the floor: it slides,
    // bearing as it goes (the moonwalk's backslide, a rise onto the ball).
    for (let i: number = 0; i + 1 < keys.length; i++) {
      const from: number = keys[i]!.leave;
      const next: IAutoMovieMotionHumanDanceFootKey = keys[i + 1]!;
      if (next.clearance === 0 && next.at > from)
        contacts.push({
          part: `${side}Foot`,
          kind: "bear",
          from: Math.max(0, from / duration),
          to: Math.min(1, next.at / duration),
          support,
        });
    }
    // The floor under the feet, read at the first key's ball.
    const floor: number = HumanFoot.point(body, side, "ball", keys[0]!.place).y;
    const leg: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLeg.place({
      body,
      side,
      from: 0,
      to: duration,
      // A foot keeps within the dorsal range of the weight it bears,
      // shedding it before it lifts.
      placement: (
        posture: IAutoMovieMotionHumanPosture,
        t: number,
      ): IAutoMovieMotionHumanFoot.IPlacement =>
        // A gesture the law holds in the air (a retiré at the knee) is its
        // own placement, the foot turned as the law turns it.
        gesture(t)
          ? placed(t)
          : AutoMovieMotionHumanFootRelax(
              body,
              posture,
              side,
              placed(t),
              planted(t)
                ? AutoMovieMotionHumanFootRelax.load(
                    t,
                    last(keys, t) + 1 < keys.length
                      ? keys[last(keys, t)]!.leave
                      : Infinity,
                    keys[last(keys, t)]!.at,
                  )
                : 0,
            ),
      planted,
    });
    // A foot risen on its ball at the floor bends its toes back by the heel's
    // lift, so they lie on the floor (as `AutoMovieMotionHumanRise` does).
    return {
      primitive: AutoMovieMotionHumanToesOnFloor.row(
        body,
        side,
        leg,
        (): number => floor,
      ),
      contacts,
      placed,
    };
  }

  /**
   * The carriage row: the hips on the caller's world path and heading, the root
   * back-solved from them, and the caller's joints written over.
   *
   * @param body The dancer's body.
   * @param duration The action's seconds.
   * @param hips The hips' world point at an action second.
   * @param yaw The heading at an action second, degrees.
   * @param joints The joints written at an action second; those of the legs are
   *   left to the feet's rows.
   * @param hands The hands' targets at an action second, if the dance places
   *   them.
   * @returns The row.
   */
  export function carry(
    body: IAutoMovieMotionHumanBody,
    duration: number,
    hips: (seconds: number) => IAutoMovieVector3,
    yaw: (seconds: number) => number,
    joints: (seconds: number) => IAutoMovieMotionHumanPosture["joints"],
    hands?: (seconds: number) => IAutoMovieMotionHumanDanceCourse.IHands,
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
        const placed: IAutoMovieMotionHumanDanceCourse.IHands =
          hands === undefined ? {} : hands(t);
        return {
          ...turned,
          limbs: {
            ...turned.limbs,
            ...(placed.left === undefined
              ? {}
              : {
                  leftArm: AutoMovieMotionHumanArm.goal(
                    body,
                    "left",
                    placed.left,
                  ),
                }),
            ...(placed.right === undefined
              ? {}
              : {
                  rightArm: AutoMovieMotionHumanArm.goal(
                    body,
                    "right",
                    placed.right,
                  ),
                }),
          },
          root: Vector3.subtract(
            hips(t),
            Quaternion.rotateVector(humanPostureHeading(turned), rest),
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
        ...(course.holds ?? []).map(
          (
            hold: IAutoMovieMotionHumanDanceCourse.IHold,
          ): IAutoMovieMotionHumanContactWindow => ({
            part: `${hold.side}Hand`,
            kind: "grip",
            from: hold.from,
            to: hold.to,
            support: { kind: "person", subject: hold.subject, bone: hold.bone },
          }),
        ),
      ]),
      clock: AutoMovieMotionClock(course.duration, course.instants),
      primitives: [
        carry(
          body,
          course.duration,
          course.hips,
          course.yaw,
          course.joints,
          course.hands,
        ),
        left.primitive,
        right.primitive,
      ],
    });
  }

  /**
   * A course's hips set over its feet: the feet's midpoint on the floor plan at
   * the entry's standing height above the entry's feet, lowered by a crouch,
   * and lowered further where feet a stride apart would leave a leg short of
   * its ankle (`pelvisReachHeight`).
   *
   * @param body The dancer's body.
   * @param entry The entry state.
   * @param course The course, whose feet are read.
   * @param crouch How far below standing the hips ride, metres.
   * @returns The hips path.
   */
  export function over(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
    course: Pick<IAutoMovieMotionHumanDanceCourse, OverCourse>,
    crouch: number,
  ): (seconds: number) => IAutoMovieVector3 {
    const ground: IAutoMovieMotionHumanContactWindow["support"] = {
      kind: "ground",
    };
    const left: IFoot = foot(
      body,
      "left",
      course.left,
      course.duration,
      ground,
    );
    const right: IFoot = foot(
      body,
      "right",
      course.right,
      course.duration,
      ground,
    );
    const hips: IAutoMovieVector3 = Vector3.add(
      entry.posture.root,
      Quaternion.rotateVector(
        humanPostureHeading(entry.posture),
        body.rest.get("hips")!,
      ),
    );
    const height: number =
      hips.y -
      (entry.feet.left.ankle.y + entry.feet.right.ankle.y) / 2 -
      crouch;
    return (t: number): IAutoMovieVector3 => {
      const a: IAutoMovieVector3 = left.placed(t).ankle;
      const b: IAutoMovieVector3 = right.placed(t).ankle;
      const floor: number = Math.min(a.y, b.y);
      const asked: IAutoMovieVector3 = {
        x: (a.x + b.x) / 2,
        y: floor + height,
        z: (a.z + b.z) / 2,
      };
      // Feet a stride apart lower the hips until both legs reach.
      return {
        ...asked,
        y: pelvisReachHeight(body, asked, course.yaw(t), { left: a, right: b }),
      };
    };
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

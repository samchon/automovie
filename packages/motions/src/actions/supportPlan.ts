import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanChannelClaim,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";

import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { prepareSupportHelperGrip } from "./prepareSupportHelperGrip";
import { prepareSupportInterval } from "./prepareSupportInterval";
import { supportBalance } from "./supportBalance";
import { supportCourse } from "./supportCourse";
import { supportWindows } from "./supportWindows";

/**
 * The support sequence's plan from its solved keys: the contact windows, the
 * overlay channels, the carried interval between every two keys, a staged
 * course's foot writers, the balance request and the prepared playback.
 * `support.plan` solves the keys; this module owns everything after them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is built from the keys and which owner solves them.
 * @evidence contracts/development/design.md#principled-representation A key is a solved posture at its second with its contacts and place lookup.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The key record and the one builder support.plan calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is typed; every one is a solved key or the interval between two.
 */
export namespace supportPlan {
  /**
   * A key posture of the plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its unit and timebase.
   * @evidence contracts/development/design.md#principled-representation A solved posture by joint angles at a second of the action.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the windows, intervals and course writers read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Keys are built only by support.plan.
   */
  export interface IKey {
    /** The posture, by joint angles alone. */
    posture: IAutoMovieMotionHumanPosture;

    /** When it is reached, seconds since the action's start. */
    seconds: number;

    /** Its event's name. */
    name: string;

    /** The contacts it rests on. */
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[];

    /** The contact positions used to form this key's goals. */
    place: supportCourse.Place;
  }

  /**
   * Build the plan from solved keys.
   *
   * @param context The action's context.
   * @param keys The solved keys in time order, the first the entry's.
   * @param duration The sequence's seconds.
   * @param entry The posture the body enters with.
   * @param course The staged route's requirements, if any.
   * @param routes The waypoint stretches of stepping feet, by the interval they span; each is carried by the root between that interval's keys.
   * @returns The plan, balanced on request.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, units and result.
   * @evidence contracts/development/implementation.md#principled-implementation Between two keys the body moves on a minimum-jerk course in joint space carried by the prepared interval; a staged course's writers and the helper's grip follow it; the balance owner then wraps the plan on request.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Windows and channels, then intervals and course writers, then one transfer shared by authored reads and prepared playback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every hand contact window keeps its arm and hand; no key is skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Authored queries find an interval in O(log K) for K ordered keys; bare playback selects the prepared phase once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Intervals are prepared once per adjacent key pair and shared by every read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns the keys and one preparation per interval until settle releases their observations.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
    keys: readonly IKey[],
    duration: number,
    entry: IAutoMovieMotionHumanPosture,
    course: supportCourse.ICourse | undefined,
    routes: ReadonlyMap<number, supportCourse.ILeg[]>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const contacts: IAutoMovieMotionHumanActionPlan["contacts"] =
      supportWindows.of(context, keys, duration, course?.observe);
    // Contact windows own the arm that reaches and the hand that holds.
    const yields: AutoMovieMotionHumanChannelClaim[] = ["head"];
    for (const side of ["left", "right"] as const)
      if (
        !contacts.some(
          (contact: IAutoMovieMotionHumanContactWindow): boolean =>
            contact.part === side + "Hand",
        )
      )
        yields.push(
          side === "left" ? "leftArm" : "rightArm",
          side === "left" ? "leftHand" : "rightHand",
        );
    const follow: ReturnType<typeof prepareSupportHelperGrip> =
      prepareSupportHelperGrip(context, contacts, duration);
    const intervals: ReturnType<typeof prepareSupportInterval>[] = keys
      .slice(0, Math.max(1, keys.length - 1))
      .map(
        (key: IKey, i: number): ReturnType<typeof prepareSupportInterval> =>
          prepareSupportInterval(
            body,
            key,
            keys[Math.min(i + 1, keys.length - 1)]!,
            key.place,
          ),
      );

    // A course's level feet stay flat on their fixture at the keys and
    // through every interval that holds them at both ends.
    // Each stepping foot's stretch, carried by the root between its keys.
    const swung: Map<number, supportCourse.Write[]> = new Map(
      [...routes].map(
        ([index, legs]: [number, supportCourse.ILeg[]]): [
          number,
          supportCourse.Write[],
        ] => [
          index,
          legs.map(
            (leg: supportCourse.ILeg): supportCourse.Write =>
              supportCourse.carried(
                body,
                leg,
                keys[index]!.posture.root,
                keys[Math.min(index + 1, keys.length - 1)]!.posture.root,
              ),
          ),
        ],
      ),
    );

    const flat: supportCourse.IBearings | undefined = supportCourse.bearings(
      body,
      course,
      keys,
    );

    /** Carry a support interval after the containing transfer has been selected. */
    const transfer = (
      index: number,
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      const a: IKey = keys[index]!;
      const b: IKey = keys[Math.min(index + 1, keys.length - 1)]!;
      const span: number = b.seconds - a.seconds;
      const w: number =
        span > 0 ? minimumJerk.share((seconds - a.seconds) / span) : 1;
      if (w === 0)
        return index === 0
          ? entry
          : supportCourse.apply(flat?.keys[index], a.posture, 0);
      if (w === 1)
        return supportCourse.apply(
          flat?.keys[Math.min(index + 1, keys.length - 1)],
          b.posture,
          0,
        );

      const posed: IAutoMovieMotionHumanPosture = intervals[index]!.write(
        w,
        resolution,
        projection,
      );
      const supported: IAutoMovieMotionHumanPosture = supportCourse.apply(
        flat?.intervals[index],
        supportCourse.apply(swung.get(index), posed, w),
        0,
      );
      return follow?.(supported, seconds, channels) ?? supported;
    };
    const unbalanced: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: keys.slice(1).map((k: IKey): { name: string; share: number } => ({
        name: k.name,
        share: k.seconds / duration,
      })),
      contacts,
      yields,
      settle: (): void => {
        for (const interval of intervals) interval.settle();
      },
      posture: (
        t: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: ReturnType<typeof prepareHumanPostureProjection>,
      ): IAutoMovieMotionHumanPosture => {
        const s: number = Math.min(duration, Math.max(0, t));
        let k: number = 0;
        let hi: number = keys.length - 2;
        while (k < hi) {
          const mid: number = Math.ceil((k + hi) / 2);
          if (keys[mid]!.seconds <= s) k = mid;
          else hi = mid - 1;
        }
        return transfer(k, s, _channels, resolution, projection);
      },
    };
    const planned: IAutoMovieMotionHumanActionPlan = supportBalance(
      context,
      unbalanced,
    );
    if (
      planned.posture === unbalanced.posture &&
      follow === undefined &&
      keys.every(
        (key: IKey, i: number): boolean =>
          i === 0 || key.seconds > keys[i - 1]!.seconds,
      )
    )
      HumanPreparedPlayback.attach(planned, body, {
        mode: "posture",
        phases: keys.slice(0, -1).map(
          (key: IKey, i: number): IAutoMovieMotionHumanPlayback.IPhase => ({
            from: key.seconds,
            to: keys[i + 1]!.seconds,
            sample: (
              ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
            ): IAutoMovieMotionHumanPlayback.ISample => ({
              posture: transfer(i, ...args),
            }),
          }),
        ),
      });
    return planned;
  }
}

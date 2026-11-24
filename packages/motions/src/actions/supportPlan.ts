import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { prepareSupportHelperGrip } from "./prepareSupportHelperGrip";
import { prepareSupportInterval } from "./prepareSupportInterval";
import { supportBalance } from "./supportBalance";
import { supportCourse } from "./supportCourse";
import { supportHeldSocket } from "./supportHeldSocket";
import { supportWindows } from "./supportWindows";

/** The record of `IOfUnbalancedResult`'s site. */
type IOfUnbalancedResult = { name: string; share: number };

/**
 * Build the plan from solved keys.
 *
 * @param context The action's context.
 * @param keys The solved keys in time order, the first the entry's.
 * @param duration The sequence's seconds.
 * @param entry The posture the body enters with.
 * @param course The staged route's requirements, if any.
 * @param routes The waypoint stretches of stepping feet, by the interval they
 *   span; each is carried by the root between that interval's keys.
 * @returns The plan, balanced on request.
 */
export function supportPlan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
  keys: readonly supportPlan.IKey[],
  duration: number,
  entry: IAutoMovieMotionHumanPosture,
  course: supportCourse.ICourse | undefined,
  routes: ReadonlyMap<number, supportCourse.ILeg[]>,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  // Each floor foot holds one sole socket through its window, which the
  // window declares and every interval of it turns the foot about.
  const socket: ReturnType<typeof supportHeldSocket> = supportHeldSocket(
    body,
    keys,
  );
  const contacts: IAutoMovieMotionHumanActionPlan["contacts"] = supportWindows(
    context,
    keys,
    duration,
    course?.observe,
    socket,
  );
  // Contact windows own the arm that reaches and the hand that holds; an
  // arm no window names hangs.
  const yields: AutoMovieMotionHumanChannelClaim[] = ["head"];
  const hanging: AutoMovieHumanSide[] = [];
  for (const side of ["left", "right"] as const)
    if (
      !contacts.some(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.part === side + "Hand",
      )
    ) {
      hanging.push(side);
      yields.push(
        side === "left" ? "leftArm" : "rightArm",
        side === "left" ? "leftHand" : "rightHand",
      );
    }
  const follow: ReturnType<typeof prepareSupportHelperGrip> =
    prepareSupportHelperGrip(context, contacts, duration);
  const intervals: ReturnType<typeof prepareSupportInterval>[] = keys
    .slice(0, Math.max(1, keys.length - 1))
    .map(
      (
        key: supportPlan.IKey,
        i: number,
      ): ReturnType<typeof prepareSupportInterval> =>
        prepareSupportInterval(
          body,
          key,
          keys[Math.min(i + 1, keys.length - 1)]!,
          key.place,
          socket,
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

  // An arm hangs through an interval where neither of its keys lays its
  // hand on anything, though the hand may take a hold later (a wall run's
  // hands before the catch).
  const free: AutoMovieHumanSide[][] = intervals.map(
    (
      _: ReturnType<typeof prepareSupportInterval>,
      index: number,
    ): AutoMovieHumanSide[] =>
      (["left", "right"] as const).filter((side: AutoMovieHumanSide): boolean =>
        [keys[index]!, keys[Math.min(index + 1, keys.length - 1)]!].every(
          (key: supportPlan.IKey): boolean =>
            !key.contacts.some(
              (contact: IAutoMovieMotionHumanSupport.IContact): boolean =>
                contact.part === `${side}Hand`,
            ),
        ),
      ),
  );

  /**
   * Carry a support interval, its hanging arms let out of the legs and trunk
   * the keys move under them (`HumanArmSwing`).
   */
  const transfer = (
    index: number,
    seconds: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    const carried: IAutoMovieMotionHumanPosture = interval(
      index,
      seconds,
      channels,
      resolution,
      projection,
    );
    const sides: AutoMovieHumanSide[] = free[index] ?? hanging;
    return sides.length === 0
      ? carried
      : HumanArmSwing(body, carried, sides, resolution, projection);
  };

  /** Carry a support interval after the containing transfer has been selected. */
  const interval = (
    index: number,
    seconds: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    const a: supportPlan.IKey = keys[index]!;
    const b: supportPlan.IKey = keys[Math.min(index + 1, keys.length - 1)]!;
    const span: number = b.seconds - a.seconds;
    const w: number =
      span > 0 ? minimumJerk.share((seconds - a.seconds) / span) : 1;
    if (w === 0)
      return index === 0
        ? entry
        : supportCourse.apply(flat?.keys[index], a.posture, 0);
    // A key between two intervals is the key itself on both sides; the
    // last key, which no interval leaves, is where the last interval
    // arrives, so the course ends on the posture it arrived with and the
    // display does not trade it for the key's own joints at its instant
    // (a near-straight arm's twist split one way by the interval's fit,
    // the other by the key's).
    if (w === 1 && index + 1 < intervals.length)
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
    events: keys.slice(1).map(
      (k: supportPlan.IKey): IOfUnbalancedResult => ({
        name: k.name,
        share: k.seconds / duration,
      }),
    ),
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
      (key: supportPlan.IKey, i: number): boolean =>
        i === 0 || key.seconds > keys[i - 1]!.seconds,
    )
  )
    HumanPreparedPlayback.attach(planned, body, {
      mode: "posture",
      phases: keys.slice(0, -1).map(
        (
          key: supportPlan.IKey,
          i: number,
        ): IAutoMovieMotionHumanPlayback.IPhase => ({
          from: key.seconds,
          to: keys[i + 1]!.seconds,
          sample: (
            ...[seconds, channels, resolution, projection]: Parameters<
              IAutoMovieMotionHumanActionPlan["posture"]
            >
          ): IAutoMovieMotionHumanPlayback.ISample => ({
            posture: transfer(i, seconds, channels, resolution, projection),
          }),
        }),
      ),
    });
  return planned;
}

/**
 * The support sequence's plan from its solved keys: the contact windows, the
 * overlay channels, the carried interval between every two keys, a staged
 * course's foot writers, the balance request and the prepared playback.
 * `support.plan` solves the keys; this module owns everything after them.
 */
export namespace supportPlan {
  /** A key posture of the plan. */
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
}

import type { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanSampledCourse } from "../posture/prepareHumanSampledCourse";
import { WALK_TICK } from "./WALK_TICK";
import { walkDescent } from "./walkDescent";
import { walkLeg } from "./walkLeg";
import type { walkLocomoteGround } from "./walkLocomoteGround";
import type { walkLocomoteSwings } from "./walkLocomoteSwings";
import { walkReach } from "./walkReach";
import { walkReachGround } from "./walkReachGround";

/** The two scheduled feet at an action second. */
type Feet = Record<
  AutoMovieHumanSide,
  IAutoMovieMotionHumanWalkFoot.IScheduled
>;

/** The pelvis's three joint angles at an action second, degrees. */
type Hips = readonly [number, number, number];

/** A posture read's optional FK source. */
type Resolution = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2];

/**
 * A stepping gait's root lowering solved in preparation: the lowering that asks
 * for itself (`walkReachGround`) is the one quantity a read would search for,
 * so it is solved exactly at the take's two ends and every swing's toe-off,
 * mid-swing and heel strike, with the middle of each interval between two of
 * them, and read between those knots from a knot course
 * (`prepareHumanKnotCourse`, a minimum-jerk path after Flash and Hogan 1985, J.
 * Neurosci. 5(7):1688). A read then places the stances under the lowered hips
 * with no root search.
 */
export namespace walkLocomoteLowering {
  /**
   * The least gap between two knots of the lowering, seconds: knots nearer than
   * a tick (`WALK_TICK`) are one.
   */
  export const GAP: number = WALK_TICK;

  /**
   * The knot seconds of a lowering: the take's two ends and every swing's
   * toe-off, mid-swing and heel strike within it, those nearer than `GAP`
   * merged, with the middle of each interval between two of them.
   *
   * @param duration The take's duration, seconds.
   * @param swings Every swing of the plan.
   * @returns The knot seconds, ascending.
   */
  export function times(
    duration: number,
    swings: readonly walkLocomoteSwings.ISwing[],
  ): number[] {
    const events: number[] = [0, duration];
    for (const swing of swings)
      events.push(swing.off, (swing.off + swing.on) / 2, swing.on);
    const sorted: number[] = events
      .filter((t: number): boolean => t >= 0 && t <= duration)
      .sort((a: number, b: number): number => a - b)
      .filter(
        (t: number, i: number, all: number[]): boolean =>
          i === 0 || t - all[i - 1]! > GAP,
      );
    const out: number[] = [];
    for (let i: number = 0; i < sorted.length; i++) {
      if (i > 0) out.push((sorted[i - 1]! + sorted[i]!) / 2);
      out.push(sorted[i]!);
    }
    return out;
  }

  /**
   * Prepare a lowering's knot course.
   *
   * @param duration The take's duration, seconds.
   * @param swings Every swing of the plan.
   * @param exact The exact lowering at a second, metres.
   * @returns The lowering's course.
   */
  export function prepare(
    duration: number,
    swings: readonly walkLocomoteSwings.ISwing[],
    exact: (t: number) => number,
  ): (seconds: number) => number[] {
    return prepareHumanSampledCourse(
      times(duration, swings),
      (t: number): number[] => [exact(t)],
    );
  }

  /**
   * Prepare each foot's stance pitch as courses: the pitch its stance rule
   * reaches (`walkReachStance`, a heel-rise search under the settled hip) is
   * solved exactly at the lowering's knots (`times`), and each foot's course is
   * split at its own toe-offs and heel strikes, so a stance's course never
   * reaches across the swing where its pivot changes. A read then places each
   * foot at its course's pitch with no search.
   *
   * @param duration The take's duration, seconds.
   * @param swings Every swing of the plan.
   * @param exact Each foot's exact pitch at a second, degrees.
   * @returns Each foot's pitch at a second, degrees.
   */
  export function prepareStances(
    duration: number,
    swings: readonly walkLocomoteSwings.ISwing[],
    exact: (t: number) => Readonly<Record<AutoMovieHumanSide, number>>,
  ): (seconds: number) => Record<AutoMovieHumanSide, number> {
    const knots: number[] = times(duration, swings);
    const intervals: Record<AutoMovieHumanSide, IStance[]> = {
      left: [],
      right: [],
    };
    for (const side of walkReach.SIDES) {
      const marks: number[] = [
        0,
        ...swings
          .filter((s: walkLocomoteSwings.ISwing): boolean => s.side === side)
          .flatMap((s: walkLocomoteSwings.ISwing): number[] => [s.off, s.on])
          .filter((t: number): boolean => t > GAP && t < duration - GAP),
        duration,
      ].sort((a: number, b: number): number => a - b);
      for (let i: number = 0; i + 1 < marks.length; i++) {
        const from: number = marks[i]!;
        const to: number = marks[i + 1]!;
        if (!(to > from)) continue;
        const at: number[] = [
          from,
          ...knots.filter((t: number): boolean => t > from + GAP && t < to - GAP),
          to,
        ];
        intervals[side].push({
          from,
          to,
          course: prepareHumanSampledCourse(at, (t: number): number[] => [
            exact(t)[side],
          ]),
        });
      }
    }
    const pitch = (side: AutoMovieHumanSide, t: number): number => {
      const list: IStance[] = intervals[side];
      const found: IStance =
        list.find((s: IStance): boolean => t <= s.to) ?? list[list.length - 1]!;
      return found.course(t)[0]!;
    };
    return (seconds: number): Record<AutoMovieHumanSide, number> => ({
      left: pitch("left", seconds),
      right: pitch("right", seconds),
    });
  }

  /** One foot's stance or swing interval and its pitch's course over it. */
  interface IStance {
    /** The interval's first second. */
    from: number;

    /** Its last second. */
    to: number;

    /** The foot's pitch over it, degrees. */
    course: (seconds: number) => number[];
  }

  /**
   * A walk's pelvis at a second under its prepared lowering: the stances placed
   * under the lowered hips, a swinging foot's claim kept only as the mark that
   * it bears no stance.
   *
   * @param context What the settling reads of the walk's plan.
   * @param t Action seconds.
   * @param feet The scheduled feet there.
   * @param amount How much the body is walking there.
   * @param hips The pelvis's joint angles there.
   * @param resolution The read's optional FK source.
   * @param drop The prepared lowering, metres.
   * @param pitches Each foot's prepared stance pitch, degrees.
   * @returns The settled pelvis and feet.
   */
  export function placed(
    context: walkLocomoteGround.IContext,
    t: number,
    feet: Feet,
    amount: number,
    hips: Hips,
    resolution: Resolution,
    drop: number,
    pitches: Readonly<Record<AutoMovieHumanSide, number>>,
  ): walkReach.IGround {
    const read: ReturnType<typeof preparePoseResolution> | undefined =
      resolution === undefined
        ? undefined
        : prepareHumanPoseResolution.read(resolution);
    const root: IAutoMovieVector3 = context.root(t);
    const frame: walkReach.IPelvis = walkReach.pelvis(
      context.body,
      root,
      context.steps.yaw(t),
      hips,
      feet,
      read,
    );

    // A swinging foot bears no stance; its claim's value is not read under a
    // prepared lowering.
    const claims: Partial<Record<AutoMovieHumanSide, number>> = {};
    for (const side of walkReach.SIDES) {
      const swing: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] =
        feet[side].swing;
      if (swing === undefined) continue;
      if (context.gait.swing > 1 || swing.u >= walkDescent.START)
        claims[side] = 0;
    }
    return walkReachGround(
      context.body,
      root,
      frame,
      feet,
      claims,
      walkLeg.ROCKER * amount,
      undefined,
      {},
      undefined,
      drop,
      pitches,
    );
  }
}

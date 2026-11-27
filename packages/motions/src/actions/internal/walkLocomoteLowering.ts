import type { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/AutoMovieMotionHumanArmCourse";
import { HumanArmTrajectoryTerms } from "../../posture/HumanArmTrajectoryTerms";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
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
 * so it is solved exactly at knots AutoKnots places (Vitenti et al. 2024,
 * arXiv:2412.13423; `prepareHumanSampledCourse`) with every swing's toe-off and
 * heel strike, where the stances it stands on change, a knot, and read between
 * those knots from a knot course (`prepareHumanKnotCourse`, a minimum-jerk path
 * after Flash and Hogan 1985, J. Neurosci. 5(7):1688), no stretch knotted finer
 * than the display's frame grid (`AutoMovieMotionHumanArmCourse.STEP`). A read
 * then places the stances under the lowered hips with no root search.
 */
export namespace walkLocomoteLowering {
  /**
   * The lowering's tolerance, metres: the limb solver's place tolerance
   * (`HumanArmTrajectoryTerms.TOLERANCE`, a millimetre) the legs reach their
   * plants to.
   */
  export const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;

  /**
   * The stance pitch's tolerance on a foot of a length, degrees: the turn that
   * moves the foot's far end by the lowering's millimetre (`TOLERANCE`), the
   * resolution the contact verdicts read.
   *
   * @param foot The foot's length, metres.
   * @returns The tolerance, degrees.
   */
  export function pitchTolerance(foot: number): number {
    return (TOLERANCE / foot) * (180 / Math.PI);
  }

  /**
   * The contact events of a walk's swings: every toe-off and heel strike.
   *
   * @param swings The swings.
   * @returns Their toe-offs and heel strikes.
   */
  export function marks(
    swings: readonly walkLocomoteSwings.ISwing[],
  ): number[] {
    return swings.flatMap((s: walkLocomoteSwings.ISwing): number[] => [
      s.off,
      s.on,
    ]);
  }

  /**
   * Prepare a lowering's knot course, every toe-off and heel strike a knot it
   * passes.
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
    return prepareHumanSampledCourse({
      from: 0,
      to: duration,
      marks: marks(swings),
      sample: (t: number): number[] => [exact(t)],
      tolerance: { kind: "absolute", absolute: TOLERANCE },
      step: AutoMovieMotionHumanArmCourse.STEP,
    });
  }

  /**
   * Prepare each foot's stance pitch as courses: the pitch its stance rule
   * reaches (`walkReachStance`, a heel-rise search under the settled hip) is
   * solved exactly at knots AutoKnots places, every contact event a knot, each
   * foot's course split at its own toe-offs and heel strikes, so a stance's
   * course never reaches across the swing where its pivot changes. A read then
   * places each foot at its course's pitch with no search.
   *
   * @param duration The take's duration, seconds.
   * @param swings Every swing of the plan.
   * @param foot The foot's length, metres (`pitchTolerance`).
   * @param exact Each foot's exact pitch at a second, degrees.
   * @returns Each foot's pitch at a second, degrees.
   */
  export function prepareStances(
    duration: number,
    swings: readonly walkLocomoteSwings.ISwing[],
    foot: number,
    exact: (t: number) => Readonly<Record<AutoMovieHumanSide, number>>,
  ): (seconds: number) => Record<AutoMovieHumanSide, number> {
    const course: (
      side: AutoMovieHumanSide,
    ) => (seconds: number) => number[] = (
      side: AutoMovieHumanSide,
    ): ((seconds: number) => number[]) =>
      prepareHumanSampledCourse({
        from: 0,
        to: duration,
        marks: marks(swings),
        breaks: marks(
          swings.filter(
            (s: walkLocomoteSwings.ISwing): boolean => s.side === side,
          ),
        ),
        sample: (t: number): number[] => [exact(t)[side]],
        tolerance: { kind: "absolute", absolute: pitchTolerance(foot) },
        step: AutoMovieMotionHumanArmCourse.STEP,
      });
    const left: (seconds: number) => number[] = course("left");
    const right: (seconds: number) => number[] = course("right");
    return (seconds: number): Record<AutoMovieHumanSide, number> => ({
      left: left(seconds)[0]!,
      right: right(seconds)[0]!,
    });
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

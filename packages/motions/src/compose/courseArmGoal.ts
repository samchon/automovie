import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { AutoMovieMotionInterval } from "./AutoMovieMotionInterval";
import { composeAutoMovieMotionHumanAction } from "./composeAutoMovieMotionHumanAction";

/**
 * A law's arm goal, written afresh at every second of its plan, planned
 * instead as one admitted course of the arm over a span
 * (`AutoMovieMotionHumanArm.carried` with the span).
 *
 * A plan whose posture writes a moving or turning arm goal at each second
 * leaves the limb fit to solve every second alone: where two arm solutions
 * nearly tie, one instant takes the other branch and the arm pops (a 93°
 * turn of the upper arm within 1/120 s in a floor pick-up), and nothing
 * admits the course against the body or the floor. Here the plan's own
 * goal is read at the span's instants and the arm is laid once: the reach
 * from `rest` to the hold, then the hold fitted instant by instant on the
 * branch and swivel the instant before chose, then the return, admitted
 * under the trajectory's clearance and speed bounds or optimised
 * (`AutoMovieMotionHumanArmCourse`, `HumanArmTrajectory`). Everything else
 * of the plan (the body, the other limbs, the digits, the events, contacts,
 * holds and refusals) is the plan's own; only its posture is replaced.
 * After the span the arm keeps the angles its course ended with, carried by
 * the body: a hand that holds what it lifted rides up with a body that
 * straightens, with no goal left to solve.
 *
 * @param props The plan, the arm, its rest, its span and the carry's
 *   optional members.
 * @returns The plan with the arm written by its planned course.
 * @throws {HumanRefusal} When no arm course meets the trajectory's constraints (`AutoMovieMotionHumanArm.carried`), as the plan is composed.
 * @throws {Error} When the plan writes no goal for the arm at an instant the course reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect it removes, how the goal is read, what is planned and what is kept.
 * @evidence contracts/development/implementation.md#principled-implementation A moving effector goal is a trajectory problem solved once with branch continuity and clearance (the planner's), never a fresh inverse kinematics solve per sample.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The plan less its arm goal is the composer's base; the planned carry is its one primitive; the composed posture replaces the plan's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goal is the plan's own at each instant; no goal, bound or timing is invented, and the planner's refusal stands.
 * @evidence contracts/development/implementation.md#efficient-algorithms One course per plan, solved when composed; at each second the plan's posture is evaluated once and shared by the base and the goal.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The last evaluated posture is reused while the second and the borrowed readers are the same.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the plan, the course, one posture and the arm's ending angles, released with the plan.
 */
export function courseArmGoal(
  props: courseArmGoal.IProps,
): IAutoMovieMotionHumanActionPlan {
  const { plan, side, span }: courseArmGoal.IProps = props;
  const limb: courseArmGoal.Limb = `${side}Arm`;
  let last: courseArmGoal.IRead | undefined;
  let composed: IAutoMovieMotionHumanActionPlan | undefined;
  let kept: IAutoMovieMotionHumanPosture["joints"] | undefined;
  const read = (
    seconds: number,
    resolution?: courseArmGoal.Resolution,
    projection?: courseArmGoal.Projection,
  ): IAutoMovieMotionHumanPosture => {
    if (
      last === undefined ||
      last.seconds !== seconds ||
      last.resolution !== resolution ||
      last.projection !== projection
    )
      last = {
        seconds,
        resolution,
        projection,
        posture: plan.posture(seconds, undefined, resolution, projection),
      };
    return last.posture;
  };
  const base: IAutoMovieMotionHumanActionPlan = {
    ...plan,
    posture: (
      seconds: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: courseArmGoal.Resolution,
      projection?: courseArmGoal.Projection,
    ): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = read(
        seconds,
        resolution,
        projection,
      );
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
        ...posture.limbs,
      };
      delete limbs[limb];
      if (seconds <= span.end) return { ...posture, limbs };

      // After its course the arm keeps the angles the course ended with,
      // carried by the body as it moves on.
      if (kept === undefined) {
        const ended: IAutoMovieMotionHumanPosture["joints"] = composed!.posture(
          span.end,
        ).joints;
        kept = {};
        for (const bone of courseArmGoal.bones(side))
          if (ended[bone] !== undefined) kept[bone] = ended[bone];
      }
      return { ...posture, limbs, joints: { ...posture.joints, ...kept } };
    },
  };
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    ...(props.together === undefined ? {} : { together: props.together }),
    ...(props.beside === undefined ? {} : { beside: props.beside }),
    ...(props.disc === undefined ? {} : { disc: props.disc }),
    ...(props.skinDistance === undefined
      ? {}
      : { skinDistance: props.skinDistance }),
    body: props.body,
    side,
    from: span.start,
    to: span.end,
    span,
    rest: props.rest,
    weight: (seconds: number): number =>
      seconds <= span.relax
        ? AutoMovieMotionInterval.progress(span.start, span.ready, seconds)
        : 1 - AutoMovieMotionInterval.progress(span.relax, span.end, seconds),
    goal: (
      _posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: courseArmGoal.Resolution,
      projection?: courseArmGoal.Projection,
    ): IAutoMovieHumanLimbGoal => {
      const goal: IAutoMovieHumanLimbGoal | undefined = read(
        seconds,
        resolution,
        projection,
      ).limbs[limb];
      if (goal === undefined)
        throw new Error(
          `The plan writes no ${limb} goal at ${seconds} s for its course to read`,
        );
      return goal;
    },
  });
  composed = composeAutoMovieMotionHumanAction({
    base,
    clock: AutoMovieMotionClock.of(
      plan.duration,
      plan.events.map(
        (e: IAutoMovieMotionEvent): courseArmGoal.Instant => ({
          name: e.name,
          seconds: e.share * plan.duration,
        }),
      ),
    ),
    primitives: [arm],
  });
  return { ...plan, posture: composed.posture };
}

/** Companion types of `courseArmGoal`. */
export namespace courseArmGoal {
  /**
   * A plan whose arm goal is to be planned as one course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The law's plan, the arm and the four instants of its course, with the carry's own optional members by `Pick`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the course reads; the goal and the weight come from the plan and the span.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The optional members are the carry's own, not restated.
   */
  export interface IProps extends Partial<
    Pick<
      IAutoMovieMotionHumanArmCarry.ICarry,
      "together" | "beside" | "disc" | "skinDistance"
    >
  > {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The law's plan, whose posture writes the arm's goal at every second the course reads. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** The arm's angles before the span, which the reach leaves. */
    rest: IAutoMovieMotionHumanArmAngles.IAngles;

    /** The course's instants, seconds since the plan's start: the reach from `start` to `ready`, the hold on the plan's goal to `relax`, the return to `end`. */
    span: IAutoMovieMotionHumanArmPlanned.ISpan;
  }

  /**
   * The last posture of the plan read, and what it was read with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is kept.
   * @evidence contracts/development/design.md#principled-representation The posture with the second and borrowed readers that identify it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written and read only by `courseArmGoal`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The readers are compared by identity, so a posture read with other readers is never reused.
   */
  export interface IRead {
    /** Seconds since the plan's start. */
    seconds: number;

    /** The borrowed forward-kinematics reader, if any. */
    resolution: Resolution | undefined;

    /** The borrowed range-of-motion projector, if any. */
    projection: Projection | undefined;

    /** The plan's posture at the second. */
    posture: IAutoMovieMotionHumanPosture;
  }

  /** The arm limb a side names. */
  export type Limb = "leftArm" | "rightArm";

  /** The bones of an arm whose angles the course writes. */
  export type Bone = `${AutoMovieHumanSide}${"UpperArm" | "LowerArm" | "Hand"}`;

  /**
   * The bones of an arm whose angles the course writes, kept after it.
   *
   * @param side The arm.
   * @returns The upper arm, the forearm and the hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bones and why they are listed.
   * @evidence contracts/development/implementation.md#principled-implementation The three joints a carried arm writes (`AutoMovieMotionHumanArmCarry`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No input is judged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bones(side: AutoMovieHumanSide): readonly Bone[] {
    return [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`];
  }

  /** A borrowed same-body forward-kinematics reader of a posture read. */
  export type Resolution = Parameters<
    IAutoMovieMotionHumanActionPlan["posture"]
  >[2];

  /** A borrowed same-body range-of-motion projector of a posture read. */
  export type Projection = Parameters<
    IAutoMovieMotionHumanActionPlan["posture"]
  >[3];

  /** A named instant of the plan's clock. */
  export type Instant = Parameters<typeof AutoMovieMotionClock.of>[1][number];
}

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

import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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
 * holds and refusals) is the plan's own; only its posture is replaced, and
 * the law's plan stays readable for judgements of the goal (`goals`). A
 * stroke whose hold is its delivery declares its own speed bound (`pace`),
 * which the course is admitted against in place of a reach's pace.
 * A goal on another performer is laid causally: the law gives the goal as
 * the performer perceived it when the plan starts (`perceived`), so the
 * course never reads the other performer ahead of that second, and may
 * follow the live goal on the hold by a bounded correction (`tracked`).
 * Two arms on one implement, or an arm and its support, are laid in one
 * course (`with`) as one trajectory problem, the hands on the implement
 * excused from each other by their declared `grasp`.
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
  const { plan }: courseArmGoal.IProps = props;
  const arms: readonly courseArmGoal.IArm[] = [props, ...(props.with ?? [])];
  // Arms coursed together are one trajectory problem: one group, solved
  // when the first of them is prepared.
  const group: IAutoMovieMotionHumanArmPlanned.ITogether | undefined =
    props.together ??
    (arms.length > 1 ? AutoMovieMotionHumanArm.together() : undefined);
  let last: courseArmGoal.IRead | undefined;
  const kept: Map<courseArmGoal.Limb, IAutoMovieMotionHumanPosture["joints"]> =
    new Map();
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
      // A law whose goal reads another performer gives its posture without
      // the coursed goals (`base`), so laying the course never evaluates the
      // live goal, and the other performer is read only as `perceived` says.
      const posture: IAutoMovieMotionHumanPosture =
        props.base === undefined
          ? read(seconds, resolution, projection)
          : props.base.posture(seconds, undefined, resolution, projection);
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
        ...posture.limbs,
      };
      let joints: IAutoMovieMotionHumanPosture["joints"] = posture.joints;
      for (const arm of arms) {
        const limb: courseArmGoal.Limb = `${arm.side}Arm`;
        const span: IAutoMovieMotionHumanArmPlanned.ISpan =
          arm.span ?? props.span;
        // Before its course the arm is the plan's own: its goal stays, so a
        // course that starts after the action does takes over from the arm
        // the plan shows, never from a frozen rest.
        if (seconds < span.start) continue;
        // After its course the arm is the plan's own again, its goal fitted on
        // the body as it moves on, unless the law asks the arm to keep the
        // angles its course ended with (`after: "angles"`).
        if (seconds > span.end && props.after !== "angles") continue;
        delete limbs[limb];
        if (seconds <= span.end) continue;

        // After its course the arm keeps the angles the course ended with,
        // carried by the body as it moves on.
        let angles: IAutoMovieMotionHumanPosture["joints"] | undefined =
          kept.get(limb);
        if (angles === undefined) {
          const ended: IAutoMovieMotionHumanPosture["joints"] =
            composed.posture(span.end).joints;
          angles = {};
          for (const bone of courseArmGoal.bones(arm.side))
            if (ended[bone] !== undefined) angles[bone] = ended[bone];
          kept.set(limb, angles);
        }
        joints = { ...joints, ...angles };
      }
      return { ...posture, limbs, joints };
    },
  };
  const primitives: IAutoMovieMotionHumanPrimitive[] = arms.map(
    (arm: courseArmGoal.IArm): IAutoMovieMotionHumanPrimitive => {
      const limb: courseArmGoal.Limb = `${arm.side}Arm`;
      const span: IAutoMovieMotionHumanArmPlanned.ISpan =
        arm.span ?? props.span;
      return AutoMovieMotionHumanArm.carried({
        ...(group === undefined ? {} : { together: group }),
        ...(props.beside === undefined ? {} : { beside: props.beside }),
        ...(arm.disc === undefined ? {} : { disc: arm.disc }),
        ...(arm.skinDistance === undefined
          ? {}
          : { skinDistance: arm.skinDistance }),
        ...(arm.grasp === undefined ? {} : { grasp: arm.grasp }),
        ...(props.pace === undefined ? {} : { pace: props.pace }),
        ...(arm.perceived === undefined ? {} : { perceived: arm.perceived }),
        ...(arm.tracked === undefined ? {} : { tracked: arm.tracked }),
        body: props.body,
        side: arm.side,
        from: span.start,
        to: span.end,
        span,
        // A course that starts after its action does leaves the plan's own arm
        // there, the arm shown before it, so the seam before the span meets it;
        // a caller whose plan already writes the goal at that instant gives
        // the arm shown just before it (`shown`).
        rest:
          span.start > 1e-9 && props.shown !== true
            ? AutoMovieMotionHumanArm.angles(
                resolveHumanPosture(props.body, read(span.start)),
                arm.side,
              )
            : arm.rest,
        // A return ends on the plan's own arm at the span's end, which the
        // plan shows from there on, or whose angles the arm keeps after it
        // (`after: "angles"`), so the seam after the span meets it.
        ...(span.relax < span.end - 1e-9
          ? {
              back: AutoMovieMotionHumanArm.angles(
                resolveHumanPosture(props.body, read(span.end)),
                arm.side,
              ),
            }
          : {}),
        weight: (seconds: number): number =>
          seconds <= span.relax
            ? AutoMovieMotionInterval.progress(span.start, span.ready, seconds)
            : 1 -
              AutoMovieMotionInterval.progress(span.relax, span.end, seconds),
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
    },
  );
  // Read by the base only after the span, once the composition exists.
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
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
      primitives,
    });
  const coursed: IAutoMovieMotionHumanActionPlan = {
    ...plan,
    posture: composed.posture,
  };
  courseArmGoal.SOURCES.set(coursed, plan);
  return coursed;
}

/**
 * Companion types, records and readers of `courseArmGoal`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit: the law plan a coursed plan's goal is read from, the arm and course records, the last read posture, the written bones and the borrowed readers.
 * @evidence contracts/development/design.md#principled-representation An arm's task and the course in the carry's own terms, by `Pick`; the goal stays the law plan's, held weakly by its coursed plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the course and its readers use; `IRead` is written and read only by `courseArmGoal`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The optional members are the carry's own, not restated; a posture read with other readers is never reused, and a copied coursed plan reads as itself.
 */
export namespace courseArmGoal {
  /** Each coursed plan's law plan, whose posture still writes the arm's goal (`goals`). */
  export const SOURCES: WeakMap<
    IAutoMovieMotionHumanActionPlan,
    IAutoMovieMotionHumanActionPlan
  > = new WeakMap();

  /**
   * The plan whose posture writes the arm's goal: a coursed plan's law plan,
   * any other plan itself. A law-side judgement of the goal (a strike's
   * event on its target, a lift's height) reads this, since the coursed
   * posture writes the arm's angles and no goal.
   *
   * @param plan A plan, coursed or not.
   * @returns The plan that writes the goal.
   */
  export function goals(
    plan: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanActionPlan {
    return SOURCES.get(plan) ?? plan;
  }

  /**
   * One arm a course lays: its side, its rest, its span and the carry's own
   * per-arm members.
   */
  export interface IArm extends Partial<
    Pick<
      IAutoMovieMotionHumanArmCarry.ICarry,
      "disc" | "skinDistance" | "grasp" | "perceived" | "tracked"
    >
  > {
    /** The arm. */
    side: AutoMovieHumanSide;

    /** The arm's angles before the span, which the reach leaves. */
    rest: IAutoMovieMotionHumanArmAngles.IAngles;

    /** The arm's own instants, for an arm of `with` whose span differs; the course's `span` when absent. */
    span?: IAutoMovieMotionHumanArmPlanned.ISpan;
  }

  /**
   * A plan whose arm goals are to be planned as one course.
   */
  export interface IProps
    extends
      Omit<IArm, "span">,
      Partial<
        Pick<
          IAutoMovieMotionHumanArmCarry.ICarry,
          "together" | "beside" | "pace"
        >
      > {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The law's plan, whose posture writes every coursed arm's goal at every second the course reads. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** The course's instants, seconds since the plan's start: the reach from `start` to `ready`, the hold on the plan's goal to `relax`, the return to `end`. */
    span: IAutoMovieMotionHumanArmPlanned.ISpan;

    /**
     * The other arm, laid in the same course as one trajectory problem: a
     * support hand, or the second hand on one implement (a two-handed blade,
     * a club, a bat, a putter), whose closing segments name each other in
     * `grasp` so the hands on the implement are its contact, not a
     * collision. None when absent.
     */
    with?: readonly IArm[];

    /**
     * The law's plan without the coursed arms' goals, for a goal that reads
     * another performer (a punch on a defender, a hand on a partner): the
     * course is laid on its posture, so laying never evaluates the live goal
     * and the other performer is read only as each arm's `perceived` gives
     * it, under the reaction delay. `plan` itself when absent.
     */
    base?: IAutoMovieMotionHumanActionPlan;

    /**
     * What the arm does after its span: the plan's own goal again ("goal",
     * the default), fitted on the body as it moves on, or the angles its
     * course ended with ("angles"), carried by the body, for a hand that
     * holds what it lifted while the body straightens under it.
     */
    after?: After;

    /**
     * Whether each arm's `rest` is the arm the plan shows just before a span
     * that starts after the action, for a plan that already writes the goal
     * at the span's start (a rescuer's crawl arm at the arrival, where the
     * plan writes the hold). Absent, such a course leaves the plan's own arm
     * read at the span's start.
     */
    shown?: boolean;
  }
  /**
   * The last posture of the plan read, and what it was read with.
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

  /** What a coursed arm does after its span (`IProps.after`). */
  export type After = "goal" | "angles";
}

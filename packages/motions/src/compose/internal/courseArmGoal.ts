import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
} from "@automovie/interface";

import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { AutoMovieMotionInterval } from "./AutoMovieMotionInterval";
import { composeAutoMovieMotionHumanAction } from "./composeAutoMovieMotionHumanAction";
import { courseArmGoalBase } from "./courseArmGoalBase";
import { courseArmGoalShownRests } from "./courseArmGoalShownRests";

/**
 * A law's arm goal, written afresh at every second of its plan, planned instead
 * as one admitted course of the arm over a span
 * (`AutoMovieMotionHumanArm.carried` with the span).
 *
 * A plan whose posture writes a moving or turning arm goal at each second
 * leaves the limb fit to solve every second alone: where two arm solutions
 * nearly tie, one instant takes the other branch and the arm pops (a 93° turn
 * of the upper arm within 1/120 s in a floor pick-up), and nothing admits the
 * course against the body or the floor. Here the plan's own goal is read at the
 * span's instants and the arm is laid once: the reach from `rest` to the hold,
 * then the hold fitted instant by instant on the branch and swivel the instant
 * before chose, then the return, admitted under the trajectory's clearance and
 * speed bounds or optimised (`AutoMovieMotionHumanArmCourse`,
 * `HumanArmTrajectory`). Everything else of the plan (the body, the other
 * limbs, the digits, the events, contacts, holds and refusals) is the plan's
 * own; only its posture is replaced, and the law's plan stays readable for
 * judgements of the goal (`goals`). A stroke whose hold is its delivery
 * declares its own speed bound (`pace`), which the course is admitted against
 * in place of a reach's pace. A goal on another performer is laid causally: the
 * law gives the goal as the performer perceived it when the plan starts
 * (`perceived`), so the course never reads the other performer ahead of that
 * second, and may follow the live goal on the hold by a bounded correction
 * (`tracked`). Two arms on one implement, or an arm and its support, are laid
 * in one course (`with`) as one trajectory problem, the hands on the implement
 * excused from each other by their declared `grasp`. After the span the arm
 * keeps the angles its course ended with, carried by the body: a hand that
 * holds what it lifted rides up with a body that straightens, with no goal left
 * to solve.
 *
 * @param props The plan, the arm, its rest, its span and the carry's optional
 *   members.
 * @returns The plan with the arm written by its planned course.
 * @throws {HumanRefusal} When no arm course meets the trajectory's constraints
 *   (`AutoMovieMotionHumanArm.carried`), as the plan is composed.
 * @throws {Error} When the plan writes no goal for the arm at an instant the
 *   course reads.
 */
export function courseArmGoal(
  props: courseArmGoal.IProps,
): IAutoMovieMotionHumanActionPlan {
  const { plan }: courseArmGoal.IProps = props;
  const arms: readonly courseArmGoal.IArm[] = [props, ...(props.with ?? [])];
  // Arms coursed together are one trajectory problem: one group, solved
  // when the first of them is prepared, each arm on its own hold.
  const group: IAutoMovieMotionHumanArmPlanned.ITogether | undefined =
    props.together ??
    (arms.length > 1 ? AutoMovieMotionHumanArm.together() : undefined);
  const beside: IAutoMovieMotionHumanArmPlanned.ITogether | undefined =
    props.beside;
  const kept: Map<courseArmGoal.Limb, IAutoMovieMotionHumanPosture["joints"]> =
    new Map();
  // Each arm's angles where its course is to end, kept until the composition
  // is laid (courseArmGoalBase), solved once here.
  const returned: Map<
    courseArmGoal.Limb,
    IAutoMovieMotionHumanPosture["joints"]
  > = new Map();
  const read = (
    seconds: number,
    resolution?: courseArmGoal.Resolution,
    projection?: courseArmGoal.Projection,
    channels?: readonly AutoMovieMotionHumanChannel[],
  ): IAutoMovieMotionHumanPosture =>
    plan.posture(seconds, channels, resolution, projection);

  for (const arm of arms) {
    const back: IAutoMoviePose = resolveHumanPosture(
      props.context.body,
      read((arm.span ?? props.span).end),
    );
    const chain: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>(courseArmGoal.bones(arm.side));
    const angles: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const joint of back.joints)
      if (chain.has(joint.bone))
        angles[joint.bone] = [
          joint.flexion ?? 0,
          joint.abduction ?? 0,
          joint.twist ?? 0,
        ];
    returned.set(`${arm.side}Arm`, angles);
  }

  // Whether the course is laid: the composition below prepares it, and its
  // planner reads each arm's goal at the seconds it reads the base at, so
  // until then the base reads the whole posture, shared with the goal.
  let laid: boolean = false;
  const base: IAutoMovieMotionHumanActionPlan = courseArmGoalBase({
    props,
    plan,
    arms,
    kept,
    returned,
    read,
    laid: (): boolean => laid,
    composed: (): IAutoMovieMotionHumanActionPlan => composed,
  });
  // What the display shows of the arms before their courses, which a course
  // starting after its action leaves from (`courseArmGoalShownRests`): read
  // once per start the group's arms share.
  const shownAt = (seconds: number): IAutoMovieMotionHumanPosture =>
    props.base === undefined ? read(seconds) : props.base.posture(seconds);
  const rests: Map<courseArmGoal.Limb, IAutoMovieMotionHumanArmAngles.IAngles> =
    new Map();
  const starts: Set<number> = new Set<number>(
    arms.map(
      (arm: courseArmGoal.IArm): number => (arm.span ?? props.span).start,
    ),
  );
  for (const start of starts)
    if (start > 1e-9)
      for (const [limb, rest] of courseArmGoalShownRests(
        props.context,
        plan,
        shownAt,
        arms.filter(
          (arm: courseArmGoal.IArm): boolean =>
            (arm.span ?? props.span).start === start,
        ),
        start,
      ))
        rests.set(limb, rest);
  // The plan's events, seconds: each one inside an arm's hold carries the
  // goal's pose there and is a waypoint of its course (`ISpan.knots`).
  const events: readonly number[] = plan.events.map(
    (event: IAutoMovieMotionEvent): number => event.share * plan.duration,
  );
  const primitives: IAutoMovieMotionHumanPrimitive[] = arms.map(
    (arm: courseArmGoal.IArm): IAutoMovieMotionHumanPrimitive => {
      const limb: courseArmGoal.Limb = `${arm.side}Arm`;
      const span: IAutoMovieMotionHumanArmPlanned.ISpan = courseArmGoal.knotted(
        arm.span ?? props.span,
        events,
      );
      return AutoMovieMotionHumanArm.carried({
        ...(group === undefined ? {} : { together: group }),
        ...(beside === undefined ? {} : { beside }),
        ...(arm.disc === undefined ? {} : { disc: arm.disc }),
        ...(arm.skinDistance === undefined
          ? {}
          : { skinDistance: arm.skinDistance }),
        ...(arm.grasp === undefined ? {} : { grasp: arm.grasp }),
        // A hand on an implement the other hand carries rides that hand's
        // planned site (`IAutoMovieMotionHumanArmCarry.ICarry.on`).
        ...(arm.on === undefined ? {} : { on: arm.on }),
        // The law's own fit of the hold's first goal, which the hold continues.
        ...(arm.hold === undefined ? {} : { hold: arm.hold }),
        ...(props.pace === undefined ? {} : { pace: props.pace }),
        ...(arm.perceived === undefined ? {} : { perceived: arm.perceived }),
        ...(arm.tracked === undefined ? {} : { tracked: arm.tracked }),
        body: props.context.body,
        side: arm.side,
        from: span.start,
        to: span.end,
        span,
        // A course leaves from the arm the display shows as it takes over:
        // the entry's at the action's start, and the plan's own as the display
        // shows it there for a course that starts later
        // (`courseArmGoalShownRests`), so the seam before the span meets it.
        rest: rests.get(limb) ?? courseArmGoal.rest(props.context, arm),
        // A return ends on the plan's own arm at the span's end, which the
        // plan shows from there on, or whose angles the arm keeps after it
        // (`after: "angles"`), so the seam after the span meets it.
        ...(span.relax < span.end - 1e-9
          ? {
              back: AutoMovieMotionHumanArm.angles(
                resolveHumanPosture(props.context.body, read(span.end)),
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
      clock: AutoMovieMotionClock(
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
  laid = true;
  // An arm that follows its partner live (`tracked`) is planned by its
  // follower; the composition names it (`IAutoMovieMotionHumanActionPlan.follows`),
  // so a plan-level reading of the plan's own goals never reads the partner.
  const coursed: IAutoMovieMotionHumanActionPlan = {
    ...plan,
    posture: composed.posture,
    // The composition's preparation runs the law's own and solves the arms'
    // courses on it, and then each arm's ending angles the base keeps after
    // its course.
    prepare: (): void => {
      composed.prepare?.();
      kept.clear();
      for (const arm of arms) {
        const span: IAutoMovieMotionHumanArmPlanned.ISpan =
          arm.span ?? props.span;
        const ended: IAutoMovieMotionHumanPosture["joints"] = composed.posture(
          span.end,
        ).joints;
        const angles: IAutoMovieMotionHumanPosture["joints"] = {};
        for (const bone of courseArmGoal.bones(arm.side))
          if (ended[bone] !== undefined) angles[bone] = ended[bone];
        kept.set(`${arm.side}Arm`, angles);
      }
    },
    ...(composed.follows === undefined ? {} : { follows: composed.follows }),
    goals: plan,
  };
  return coursed;
}

/** Companion types, records and readers of `courseArmGoal`. */
export namespace courseArmGoal {
  /**
   * The plan whose posture writes the arm's goal: a coursed plan's law plan,
   * any other plan itself. A law-side judgement of the goal (a strike's event
   * on its target, a lift's height) reads this, since the coursed posture
   * writes the arm's angles and no goal.
   *
   * @param plan A plan, coursed or not.
   * @returns The plan that writes the goal.
   */
  export function goals(
    plan: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanActionPlan {
    return plan.goals ?? plan;
  }
  /**
   * One arm a course lays: its side, its rest, its span and the carry's own
   * per-arm members.
   */
  export interface IArm extends Partial<
    Pick<IAutoMovieMotionHumanArmCarry.ICarry, CourseArmGoalArm>
  > {
    /** The arm. */
    side: AutoMovieHumanSide;

    /**
     * The arm's angles a course starting with the action leaves from, and the
     * arm from which the display's course of the plan's own goal runs to a
     * course that starts later, which leaves from where that one shows the arm
     * (`courseArmGoalShownRests`); the arm as the action is entered when absent
     * (`AutoMovieMotionHumanArm.entered`), the rest every course takes unless
     * its law states another.
     */
    rest?: IAutoMovieMotionHumanArmAngles.IAngles;

    /**
     * The arm's own instants, for an arm of `with` whose span differs; the
     * course's `span` when absent. Arms laid together whose spans differ stay
     * one trajectory problem, each arm's site read on its own hold
     * (`AutoMovieMotionHumanArmPlanned.planned`).
     */
    span?: IAutoMovieMotionHumanArmPlanned.ISpan;
  }

  /** A plan whose arm goals are to be planned as one course. */
  export interface IProps
    extends
      Omit<IArm, "span">,
      Partial<Pick<IAutoMovieMotionHumanArmCarry.ICarry, CourseArmGoalProps>> {
    /**
     * The action's context: its body, and the arms it is entered with, every
     * course's rest where its arm states none (`IArm.rest`).
     */
    context: IContext;

    /**
     * The law's plan, whose posture writes every coursed arm's goal at every
     * second the course reads.
     */
    plan: IAutoMovieMotionHumanActionPlan;

    /**
     * The course's instants, seconds since the plan's start: the reach from
     * `start` to `ready`, the hold on the plan's goal to `relax`, the return to
     * `end`.
     */
    span: IAutoMovieMotionHumanArmPlanned.ISpan;

    /**
     * The other arm, laid in the same course as one trajectory problem: a
     * support hand, or the second hand on one implement (a two-handed blade, a
     * club, a bat, a putter), whose closing segments name each other in `grasp`
     * so the hands on the implement are its contact, not a collision. None when
     * absent.
     */
    with?: readonly IArm[];

    /**
     * The law's plan without the coursed arms' goals, for a goal that reads
     * another performer (a punch on a defender, a hand on a partner): the
     * course is laid on its posture, so laying never evaluates the live goal
     * and the other performer is read only as each arm's `perceived` gives it,
     * under the reaction delay. `plan` itself when absent.
     */
    base?: IAutoMovieMotionHumanActionPlan;

    /**
     * What the arm does after its span: the plan's own goal again ("goal", the
     * default), fitted on the body as it moves on, or the angles its course
     * ended with ("angles"), carried by the body, for a hand that holds what it
     * lifted while the body straightens under it.
     */
    after?: After;
  }
  /**
   * A span with the plan's events inside its hold as its knots
   * (`IAutoMovieMotionHumanArmPlanned.ISpan.knots`): each event carries the
   * goal's pose at its instant, so the course has a waypoint there, as trajopt
   * imposes a pose term at a timestep (github.com/joschu/trajopt,
   * `src/trajopt/problem_description.cpp`; Schulman et al. 2014, IJRR 33:1251,
   * section VII-B). The hold's own ends are waypoints already.
   *
   * @param span The span, seconds since the plan's start.
   * @param events The plan's events, seconds since the plan's start.
   * @returns The span with its knots, ascending and without repeats; the span
   *   itself when no event lies inside its hold.
   */
  export function knotted(
    span: IAutoMovieMotionHumanArmPlanned.ISpan,
    events: readonly number[],
  ): IAutoMovieMotionHumanArmPlanned.ISpan {
    const inside: number[] = events.filter(
      (t: number): boolean => t > span.ready + 1e-9 && t < span.relax - 1e-9,
    );
    if (inside.length === 0) return span;
    const knots: number[] = [
      ...new Set<number>([...(span.knots ?? []), ...inside]),
    ].sort((a: number, b: number): number => a - b);
    return { ...span, knots };
  }

  /**
   * What a course reads of its action's context: the body, and the pose the
   * action is entered with, whose arms are every course's rest where its arm
   * states none. An action's context is one; a helper that lays a course from
   * another pose (a seed, an address) states that pose as the entry.
   */
  export interface IContext extends AutoMovieMotionHumanArm.IEntered {
    /** The body. */
    body: IAutoMovieMotionHumanBody;
  }

  /**
   * An arm's rest: the one its law states, else the arm as the action is
   * entered (`AutoMovieMotionHumanArm.entered`), so a course plans from the
   * entry state (transitions.md, "Carry resolved entry state through cuts").
   *
   * @param context The action's context.
   * @param arm The arm.
   * @returns Its rest angles.
   */
  export function rest(
    context: IContext,
    arm: Pick<IArm, CourseArmGoalRestArm>,
  ): IAutoMovieMotionHumanArmAngles.IAngles {
    return arm.rest ?? AutoMovieMotionHumanArm.entered(context, arm.side);
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
  export type Instant = Parameters<typeof AutoMovieMotionClock>[1][number];

  /** What a coursed arm does after its span (`IProps.after`). */
  export type After = "goal" | "angles";

  /** The alternatives of `CourseArmGoalArm`'s site. */
  type CourseArmGoalArm =
    | "disc"
    | "skinDistance"
    | "grasp"
    | "perceived"
    | "tracked"
    | "on"
    | "hold";

  /** The alternatives of `CourseArmGoalProps`'s site. */
  type CourseArmGoalProps = "together" | "beside" | "pace";

  /** The alternatives of `CourseArmGoalRestArm`'s site. */
  type CourseArmGoalRestArm = "side" | "rest";
}

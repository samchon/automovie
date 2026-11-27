import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanArmTrajectory } from "../../posture/internal/HumanArmTrajectory";
import { certifyHumanArmTracks } from "../../posture/internal/certifyHumanArmTracks";
import type { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import type { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";
import type { AutoMovieMotionHumanArmPlannedProblem } from "./AutoMovieMotionHumanArmPlannedProblem";
import type { AutoMovieMotionHumanArmPlannedReads } from "./AutoMovieMotionHumanArmPlannedReads";
import { AutoMovieMotionHumanArmPlayed } from "./AutoMovieMotionHumanArmPlayed";
import { AutoMovieMotionHumanArmRetimed } from "./AutoMovieMotionHumanArmRetimed";

/**
 * The solve of an arms' plan (`AutoMovieMotionHumanArmPlanned.planned`): the
 * laid course kept when admitted; otherwise independent paths for a pair with
 * separate sites whose course fails on collision, certified together; otherwise
 * the optimiser seeded by the course and an earlier plan's solution, its own
 * solution or the path a refusal for time was reached at handed on. Each hand
 * then plays the finger state its bases carried. Read from the plan's body,
 * span, arms, handover, course, readings and problem.
 *
 * @param scope What the plan solves with.
 * @returns Each arm's trajectory.
 * @throws {HumanRefusal} When no trajectory meets the constraints
 *   (`HumanArmTrajectory.solve`).
 */
export function AutoMovieMotionHumanArmPlannedSolve(
  scope: AutoMovieMotionHumanArmPlannedSolve.IScope,
): Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Played> {
  const {
    body,
    span,
    carries,
    plan,
    laid,
    fitted,
    aimed,
    without,
    read,
    bases,
    fingers,
    times,
    waypoints,
    problem,
    guess,
    refusal,
    planned,
  }: AutoMovieMotionHumanArmPlannedSolve.IScope = scope;
  let solved: IAutoMovieMotionHumanArmTrajectory.Trajectory[];
  if (laid?.admitted === true) solved = laid.trajectories;
  else {
    // An earlier plan's solution of these arms, carried onto this span,
    // starts the solve; this plan's own is left for the next. Both are
    // keyed by the arms and the group's place among its plan's groups.
    const key: string =
      (plan?.ordinal === undefined ? "" : `${plan.ordinal}:`) +
      carries
        .map((c: IAutoMovieMotionHumanArmPlanned.IPlanned): string => c.side)
        .join("+");
    const earlier: IWarm | undefined = plan?.warm?.get(key);
    const separate:
      | IAutoMovieMotionHumanArmTrajectory.Trajectory[]
      | undefined =
      earlier === undefined &&
      (laid?.refused === "probe" || laid?.refused === "swept") &&
      carries.length === 2 &&
      carries.every(
        (carry: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
          carry.on === undefined &&
          carry.grasp === undefined &&
          carry.perceived === undefined,
      )
        ? independent(laid)
        : undefined;
    if (separate !== undefined) solved = separate;
    else {
      // A hold from the first instant (`ready` at `start`) has no reach:
      // the arm is already on its site as it enters, so its hold starts
      // from the rest it enters in, not from a cold fit of another branch
      // that no path of no time could join.
      guess(
        carries.map(
          (
            c: IAutoMovieMotionHumanArmPlanned.IPlanned,
            a: number,
          ): IAutoMovieMotionHumanArmAngles.IAngles =>
            span.ready <= span.start ? c.rest : fitted(a, span.ready),
        ),
      );
      waypoints();
      // A refusal for time hands on the path it was reached at: the replan
      // at the slower time the refusal names starts from it (`warm`).
      const told: HumanArmTrajectory.IMirrorTold = { flip: false };
      let result: HumanArmTrajectory.ISolved;
      try {
        result = HumanArmTrajectory.solve(
          problem,
          times,
          laid,
          earlier === undefined
            ? undefined
            : AutoMovieMotionHumanArmRetimed(earlier, span),
          plan?.stretches === true,
          told,
        );
      } catch (error: unknown) {
        if (plan !== undefined && told.state !== undefined)
          (plan.last ??= new Map()).set(key, { span, state: told.state });
        // The plan's replan reads which group refused (`within`).
        const refused: IRefusal | undefined = refusal();
        if (refused !== undefined) {
          refused.group = key;
          refused.error = error;
        }
        throw error;
      }
      if (plan !== undefined)
        (plan.last ??= new Map()).set(key, { span, state: result.state });
      solved = result.trajectories;
    }
  }
  // Each hand plays the finger state its bases carried, between the
  // instants the plan read (`AutoMovieMotionHumanArmPlayed.prepare`).
  const instants: number[] = [...fingers.keys()].sort(
    (x: number, y: number): number => x - y,
  );
  return new Map(
    carries.map(
      (
        c: IAutoMovieMotionHumanArmPlanned.IPlanned,
        a: number,
      ): [AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Played] => {
        const played: (
          seconds: number,
        ) => IAutoMovieMotionHumanPosture["joints"] =
          AutoMovieMotionHumanArmPlayed.prepare(
            instants,
            instants.map(
              (t: number): IAutoMovieMotionHumanPosture["joints"] =>
                fingers.get(t)![a]!,
            ),
          );
        const arm: IAutoMovieMotionHumanArmTrajectory.Trajectory = solved[a]!;
        return [
          c.side,
          (seconds: number): IAutoMovieMotionHumanArmTrajectory.IPlayed => ({
            ...arm(seconds),
            digits: played(seconds),
          }),
        ];
      },
    ),
  );

  /**
   * Try separate paths while keeping the coupled clock and borrowing
   * completed inputs only.
   */
  function independent(
    course: HumanArmTrajectory.IAdmitted,
  ): IAutoMovieMotionHumanArmTrajectory.Trajectory[] | undefined {
    const outside: symbol = Symbol();
    const prior = (seconds: number): IAutoMovieMotionHumanPosture => {
      // A completed base at this time proves both original goals were read.
      if (!bases.has(seconds)) throw outside;
      return without(read.get(seconds)!.posture);
    };
    try {
      const tracks: IAutoMovieMotionHumanArmTrajectory.Trajectory[] =
        carries.map(
          (
            carry: IAutoMovieMotionHumanArmPlanned.IPlanned,
            arm: number,
          ): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
            planned(
              body,
              span,
              [
                {
                  ...carry,
                  goal: (
                    _: IAutoMovieMotionHumanPosture,
                    seconds: number,
                  ): IAutoMovieHumanLimbGoal => {
                    if (!bases.has(seconds)) throw outside;
                    return aimed(arm, seconds);
                  },
                },
              ],
              prior,
              { tempo: plan?.tempo },
              course.read.context.speed,
            ).get(carry.side)!,
        );
      return certifyHumanArmTracks(course.read.context, tracks);
    } catch (error: unknown) {
      if (error === outside || error instanceof HumanRefusal) return undefined;
      throw error;
    }
  }
}

/** What the solve of an arms' plan reads. */
export namespace AutoMovieMotionHumanArmPlannedSolve {
  /** What an arms' plan solves with. */
  export interface IScope {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The span's instants. */
    span: IAutoMovieMotionHumanArmPlanned.ISpan;

    /** The arms. */
    carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[];

    /** The group's handover; nothing is read or kept when absent. */
    plan: Parameters<typeof AutoMovieMotionHumanArmPlanned.planned>[4];

    /** The laid course (`AutoMovieMotionHumanArmCourse.course`). */
    laid: ReturnType<typeof AutoMovieMotionHumanArmCourse.course>;

    /** An arm's own fit (`AutoMovieMotionHumanArmPlannedReads`). */
    fitted: AutoMovieMotionHumanArmPlannedReads.IReads["fitted"];

    /** An arm's goal (`AutoMovieMotionHumanArmPlannedReads`). */
    aimed: AutoMovieMotionHumanArmPlannedReads.IReads["aimed"];

    /**
     * The posture without the planned arms
     * (`AutoMovieMotionHumanArmPlannedReads`).
     */
    without: AutoMovieMotionHumanArmPlannedReads.IReads["without"];

    /** Each instant's posture read (`AutoMovieMotionHumanArmPlannedReads`). */
    read: AutoMovieMotionHumanArmPlannedReads.IReads["read"];

    /** Each instant's base (`AutoMovieMotionHumanArmPlannedReads`). */
    bases: AutoMovieMotionHumanArmPlannedReads.IReads["bases"];

    /** Each instant's finger states (`AutoMovieMotionHumanArmPlannedReads`). */
    fingers: AutoMovieMotionHumanArmPlannedReads.IReads["fingers"];

    /** The optimiser's waypoints (`AutoMovieMotionHumanArmPlannedProblem`). */
    times: AutoMovieMotionHumanArmPlannedProblem.IReaders["times"];

    /** The waypoints' cut (`AutoMovieMotionHumanArmPlannedProblem`). */
    waypoints: AutoMovieMotionHumanArmPlannedProblem.IReaders["waypoints"];

    /** The problem (`AutoMovieMotionHumanArmPlannedProblem`). */
    problem: AutoMovieMotionHumanArmPlannedProblem.IReaders["problem"];

    /** The guesses' setter (`AutoMovieMotionHumanArmPlannedProblem`). */
    guess: AutoMovieMotionHumanArmPlannedProblem.IReaders["guess"];

    /**
     * Where the plan in scope names a refusing group
     * (`AutoMovieMotionHumanArmPlanned.within`).
     *
     * @returns The refusal record; none outside a plan or when none is asked.
     */
    refusal: () => IRefusal | undefined;

    /**
     * The planner, for each arm's own plan
     * (`AutoMovieMotionHumanArmPlanned.planned`).
     */
    planned: typeof AutoMovieMotionHumanArmPlanned.planned;
  }
}

/** An earlier plan's solution (`AutoMovieMotionHumanArmPlanned.IWarm`). */
type IWarm = AutoMovieMotionHumanArmPlanned.IWarm;

/** A refusing group's record (`AutoMovieMotionHumanArmPlanned.IRefusal`). */
type IRefusal = AutoMovieMotionHumanArmPlanned.IRefusal;

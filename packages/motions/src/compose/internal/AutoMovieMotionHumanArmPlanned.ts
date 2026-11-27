import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanArmGeometry } from "../../posture/internal/HumanArmGeometry";
import { HumanArmSeed } from "../../posture/internal/HumanArmSeed";
import type { HumanArmTrajectory } from "../../posture/internal/HumanArmTrajectory";
import { HumanArmTrajectoryContext } from "../../posture/internal/HumanArmTrajectoryContext";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmObservation } from "./AutoMovieMotionHumanArmObservation";
import { motionHumanArmPlannedProblem } from "./motionHumanArmPlannedProblem";
import { motionHumanArmPlannedReads } from "./motionHumanArmPlannedReads";
import { motionHumanArmPlannedSolve } from "./motionHumanArmPlannedSolve";
import { motionHumanArmStated } from "./motionHumanArmStated";
import { AutoMovieMotionHumanArmPlannedData } from "./AutoMovieMotionHumanArmPlannedData";

/*
 * An arm's whole action planned as one trajectory (`HumanArmTrajectory`): its
 * reach from rest, its hold on the goal's site and its return, read off the
 * posture so far and solved once, alone or with the other arm of the same
 * span.
 */
export namespace AutoMovieMotionHumanArmPlanned {
  /*
   * An earlier plan's solution of a group's arms, handed to the next plan of
   * the same action (`IAutoMovieMotionHumanArmPlanned.IWarm`).
   */
  export type IWarm = IAutoMovieMotionHumanArmPlanned.IWarm;

  /*
   * The group of a plan whose solve refused (`within`).
   */
  export interface IRefusal {
    /*
     * The refusing group's handover key (`IWarm`'s key with its ordinal);
     * absent until a group of the plan refuses.
     */
    group?: string;

    /*
     * What that group's solve threw.
     */
    error?: unknown;
  }

  /*
   * One instant of a hold to check: the arms holding there and the second.
   */
  export interface IStill {
    /*
     * The arms, each with its goal on its hold at the second.
     */
    carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[];

    /*
     * The second, the plan's own.
     */
    seconds: number;
  }

  /*
   * The least waypoints a second of a reach, a return or a hold: a site moving
   * as fast as a daily reach's peak travels at most `SPACING` between two of
   * them.
   */
  export const LEAST: number = Math.ceil(AutoMovieMotionHumanArmPlannedData.PEAK / AutoMovieMotionHumanArmPlannedData.SPACING);

  /*
   * A group for arms moved together.
   * Parameter handover: The action's handover between its plans
   * (`IHumanActionContext.handover`): the group reads the last plan's
   * solutions from it and writes its own into it. Absent, the group takes the
   * handover of the action whose plan is in scope (`within`), and hands
   * nothing on outside one.
   * Parameter stretches: Whether the group's span is its law's own, lengthened by a
   * slower tempo (`ITogether.stretches`).
   * Parameter tempo: The explicit replanning multiplier on elapsed time, 1 by
   * default.
   * Returns: The empty group.
   */
  export function together(
    handover?: IAutoMovieMotionHumanActionContext.IHandover,
    stretches?: boolean,
    tempo?: number,
  ): IAutoMovieMotionHumanArmPlanned.ITogether {
    // Inside an action's plan (`within`) every group takes the action's
    // handover and its place among the plan's groups, whether or not its
    // law names the handover.
    const handed: IAutoMovieMotionHumanActionContext.IHandover | undefined =
      handover ?? scope?.handover;
    const ordinal: number | undefined =
      scope === undefined ? undefined : scope.made++;
    return {
      carries: [],
      ...(handed?.warm === undefined ? {} : { warm: handed.warm }),
      ...(handed === undefined ? {} : { last: handed.last }),
      ...(stretches === true ? { stretches } : {}),
      ...(tempo === undefined ? {} : { tempo }),
      ...(ordinal === undefined ? {} : { ordinal }),
    };
  }

  /*
   * Run one plan of an action with its handover in scope: every group the plan
   * makes (`together`, the default group of a carry included) reads the
   * action's last plan's solutions and writes its own, keyed by its place among
   * the plan's groups, so a replan at a slower time (`HumanPerformanceTempo`)
   * starts each solve where the last plan's ended. Scopes nest: an inner plan's
   * groups are its own, and the enclosing scope is restored on return or throw.
   * A group of the plan whose solve refuses names itself in `refusal`, so the
   * replan can tell one group's need from another's.
   * Parameter handover: The action's handover (`IHumanActionContext.handover`);
   * absent, the plan runs with no scope.
   * Parameter run: The plan.
   * Parameter refusal: Where the group whose solve refused is named; absent, none
   * is named.
   * Returns: What the plan returns.
   */
  export function within<T>(
    handover: IAutoMovieMotionHumanActionContext.IHandover | undefined,
    run: () => T,
    refusal?: IRefusal,
  ): T {
    if (handover === undefined) return run();
    const enclosing: IScope | undefined = scope;
    scope = {
      handover,
      made: 0,
      ...(refusal === undefined ? {} : { refusal }),
    };
    try {
      return run();
    } finally {
      scope = enclosing;
    }
  }

  /*
   * The span a carry's weight states, its four instants read off the weight's
   * crossings of 0 and 1 (`motionHumanArmStated`, which states the
   * precision and the weights that state no span). The alias transforms no
   * input and adds no state.
   */
  export const stated: typeof motionHumanArmStated =
    motionHumanArmStated;

  /*
   * Physical reach-duration observation, shared with touch-law planning.
   *
   * AutoMovieMotionHumanArmObservation.reaching owns the unchanged actual arc
   * samples, speed bound and result in seconds. The alias transforms no input
   * and adds no wrapper, evaluated result or retained query state.
   */
  export const reaching: typeof AutoMovieMotionHumanArmObservation.reaching =
    AutoMovieMotionHumanArmObservation.reaching;

  /*
   * Whether the arms can hold at one instant: the course's own still problem
   * there (`HumanArmSeed.held`), on the bases, sites and starts the course
   * would read at that instant (`planned` with `still`), so what a law admits
   * by it is what the course can place.
   * Parameter body: The body.
   * Parameter still: The arms and the second.
   * Parameter before: The prefix posture at any second, the arms' goals read off
   * it.
   * Returns: Whether a configuration holds every hand on its site with every
   * arm clear there.
   */
  export function stands(
    body: IAutoMovieMotionHumanBody,
    still: IStill,
    before: IAutoMovieMotionHumanActionPlan["posture"],
  ): boolean {
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: still.seconds - STEP,
      ready: still.seconds,
      relax: still.seconds,
      end: still.seconds + STEP,
    };
    try {
      planned(
        body,
        span,
        still.carries.map(
          (
            c: IAutoMovieMotionHumanArmPlanned.IPlanned,
          ): IAutoMovieMotionHumanArmPlanned.IPlanned => ({ ...c, span }),
        ),
        before,
        undefined,
        undefined,
        true,
      );
      return true;
    } catch (error: unknown) {
      if (error instanceof AutoMovieMotionHumanRefusal) return false;
      throw error;
    }
  }
  /*
   * Arms solved as one trajectory problem over their span
   * (`HumanArmTrajectory`), against the posture so far with every one of them
   * left out: a carry's, and a whole-body law's that writes its arms itself (a
   * gesture).
   *
   * Every goal is read as the plan perceives it (`ICarry.perceived`), so a goal
   * on another person reads them where the performer saw them when the plan
   * starts, never at a later second.
   *
   * The waypoints: the reach and the return spaced by the arc their blend
   * covers (`SPACING` of the farthest probe's travel, between `1 / LEAST` and a
   * frame), the hold at the least spacing (`LEAST` a second, the rate a site at
   * a daily reach's peak speed moves `SPACING` at), and every knot of the span
   * (`ISpan.knots`, an instant that carries a pose constraint) a waypoint of
   * its own; the solve then splits every interval that does not bound its
   * site's path or its probes' clearance (`HumanArmRefine`), down to the frame
   * grid at the finest, so a still hold keeps few waypoints and a stroke as
   * many as its motion needs. On the hold each arm's site is its goal's contact
   * in the world; a site on a segment of another arm of the group rides that
   * arm as it is solved.
   * Parameter body: The body.
   * Parameter span: The span's instants.
   * Parameter carries: The arms.
   * Parameter before: The prefix posture at any second, accepting this same-body
   * plan's synchronous FK/ROM loans through the shared posture signature.
   * Parameter plan: The group's handover: its `warm` read for an earlier plan's
   * solution of these arms, its `last` written with this plan's own when the
   * optimiser ran, or with the path a refusal for time was reached at
   * (`IMirrorTold.state`), which the replan at the slower time starts from.
   * Absent, nothing is read or kept.
   * Parameter inheritedPace: Exact original group pace, supplied only for a trial
   * of one member.
   * Parameter still: Whether only the hold's instant (`span.ready`) is solved as
   * the course's still problem, refusing as the course would there, and no
   * course is laid (`stands`).
   * Returns: Each arm's trajectory.
   * When no trajectory meets the constraints
   * (`HumanArmTrajectory.solve`).
   */
  export function planned(
    body: IAutoMovieMotionHumanBody,
    span: IAutoMovieMotionHumanArmPlanned.ISpan,
    carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[],
    before: IAutoMovieMotionHumanActionPlan["posture"],
    plan?: Pick<IAutoMovieMotionHumanArmPlanned.ITogether, PlannedPlan>,
    inheritedPace?: (seconds: number) => number,
    still?: boolean,
  ): Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Played> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const {
      without,
      read,
      at,
      aimed,
      fitted,
      travel,
      bases,
      fingers,
      base,
      holding,
    }: motionHumanArmPlannedReads.IReads =
      motionHumanArmPlannedReads({
        body,
        span,
        carries,
        before,
        resolution,
        projection,
      });
    const {
      times,
      waypoints,
      problem,
      guess,
    }: motionHumanArmPlannedProblem.IReaders =
      motionHumanArmPlannedProblem({
        body,
        span,
        carries,
        at,
        aimed,
        base,
        holding,
        travel,
        resolution,
        least: LEAST,
        spacing: AutoMovieMotionHumanArmPlannedData.SPACING,
      });
    // A still check (`stands`) solves the hold's one instant as the course's
    // own still problem (`HumanArmSeed.held`), on the course's own bases and
    // sites, from each arm's own fit there, and lays no course.
    if (still === true) {
      const instants: number[] = [span.start, span.ready, span.end];
      const read: HumanArmTrajectory.IProblem = problem(instants);
      const context: ReturnType<
        ReturnType<typeof HumanArmTrajectoryContext.prepare>
      > = HumanArmTrajectoryContext.prepare(
        body,
        carries.map(
          (c: IAutoMovieMotionHumanArmPlanned.IPlanned): AutoMovieHumanSide =>
            c.side,
        ),
      )(read);
      HumanArmSeed.held(
        read,
        context,
        carries.map(
          (
            c: IAutoMovieMotionHumanArmPlanned.IPlanned,
            a: number,
          ): number[][] =>
            instants.map((t: number): number[] =>
              HumanArmGeometry.encode(
                context.setups[a]!,
                t === span.ready ? fitted(a, t) : c.rest,
              ),
            ),
        ),
      );
      return new Map();
    }
    // The course an animation system lays (`AutoMovieMotionHumanArmCourse`),
    // kept when the model's own reading admits it; otherwise the
    // optimiser's seed.
    const laid: ReturnType<typeof AutoMovieMotionHumanArmCourse.course> =
      AutoMovieMotionHumanArmCourse.course(
        {
          body,
          span,
          tempo: plan?.tempo,
          arms: carries,
          at,
          aimed,
          problem,
          resolution,
        },
        inheritedPace,
      );
    return motionHumanArmPlannedSolve({
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
      refusal: (): IRefusal | undefined => scope?.refusal,
      planned,
    });
  }

  /*
   * Observed target motion since the plan perceived it, in world metres.
   *
   * AutoMovieMotionHumanArmObservation.moved owns the original same-base
   * perceived/current site comparison and its error/contact/base result. This
   * alias adds no wrapper or retained observation state.
   */
  export const moved: typeof AutoMovieMotionHumanArmObservation.moved =
    AutoMovieMotionHumanArmObservation.moved;

  /*
   * The plan in scope, while one runs (`within`).
   */
  let scope: IScope | undefined;

  /*
   * The plan in scope (`within`): its action's handover, how many groups it has
   * made and where a refusing group is named.
   */
  interface IScope {
    /*
     * The action's handover.
     */
    handover: IAutoMovieMotionHumanActionContext.IHandover;

    /*
     * The groups the plan has made so far.
     */
    made: number;

    /*
     * Where a refusing group is named.
     */
    refusal?: IRefusal;
  }
}

/*
 * The spacing of the trajectory's waypoints, seconds at most: the frame grid
 * (`AutoMovieMotionHumanArmCourse.STEP`).
 */
const STEP: number = AutoMovieMotionHumanArmCourse.STEP;

/*
 * The alternatives of `PlannedPlan`'s site.
 */
type PlannedPlan = "warm" | "last" | "stretches" | "tempo" | "ordinal";

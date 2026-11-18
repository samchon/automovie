import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAimed } from "./AutoMovieMotionHumanArmAimed";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmObservation } from "./AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanArmRetimed } from "./AutoMovieMotionHumanArmRetimed";
import { AutoMovieMotionHumanArmRide } from "./AutoMovieMotionHumanArmRide";
import { AutoMovieMotionHumanArmStated } from "./AutoMovieMotionHumanArmStated";

/**
 * An arm's whole action planned as one trajectory (`HumanArmTrajectory`):
 * its reach from rest, its hold on the goal's site and its return, read off
 * the posture so far and solved once, alone or with the other arm of the
 * same span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the planned trajectory and fixed span; reaching/moved alias the physical observations documented at AutoMovieMotionHumanArmObservation while this namespace owns trajectory construction.
 * @evidence contracts/development/design.md#principled-representation The action's four instants, the group of arms solved together, each arm's task and the reach's duration, the inputs of one trajectory problem.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The span, the group and its constructor, the planned arm, the planner and the reach's duration, read by the carry, the touch law and the gesture law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The trajectory's problem is the planner's own (`HumanArmTrajectory`); this file only reads it off the action.
 */
export namespace AutoMovieMotionHumanArmPlanned {
  /**
   * An earlier plan's solution of a group's arms, handed to the next plan
   * of the same action (`IAutoMovieMotionHumanArmPlanned.IWarm`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the record and its owner.
   * @evidence contracts/development/design.md#principled-representation The interface's own record, read under the planner's name.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One alias, read by the group and the planner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second definition: the alias is the interface record.
   */
  export type IWarm = IAutoMovieMotionHumanArmPlanned.IWarm;

  /**
   * A group for arms moved together.
   *
   * @param handover The action's handover between its plans (`IHumanActionContext.handover`): the group reads the last plan's solutions from it and writes its own into it. Absent, the group hands nothing on.
   * @param stretches Whether the group's span is its law's own, lengthened by a slower tempo (`ITogether.stretches`).
   * @returns The empty group.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A group starts empty; its carries join it as they are built. Its `warm` and `last` are the action's handover maps themselves, so every group of one plan writes where the next plan of the action reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: no member is assumed, and a handed solution is only a start (`planned`).
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The group holds its carries and their solution, released with the primitives that close over it; the handover maps are the performance's.
   */
  export function together(handover?: IAutoMovieMotionHumanActionContext.IHandover, stretches?: boolean): IAutoMovieMotionHumanArmPlanned.ITogether {
    return {
      carries: [],
      ...(handover?.warm === undefined ? {} : { warm: handover.warm }),
      ...(handover === undefined ? {} : { last: handover.last }),
      ...(stretches === true ? { stretches } : {}),
    };
  }

  /**
   * The span a carry's weight states, its four instants read off the
   * weight's crossings of 0 and 1 (`AutoMovieMotionHumanArmStated`, which
   * states the precision and the weights that state no span). The alias
   * transforms no input and adds no state.
   */
  export const stated: typeof AutoMovieMotionHumanArmStated = AutoMovieMotionHumanArmStated;

  /**
   * Physical reach-duration observation, shared with touch-law planning.
   *
   * AutoMovieMotionHumanArmObservation.reaching owns the unchanged actual
   * arc samples, speed bound and result in seconds. The alias transforms
   * no input and adds no wrapper, evaluated result or retained query state.
   */
  export const reaching: typeof AutoMovieMotionHumanArmObservation.reaching = AutoMovieMotionHumanArmObservation.reaching;
  /**
   * Arms solved as one trajectory problem over their span
   * (`HumanArmTrajectory`), against the posture so far with every one of
   * them left out: a carry's, and a whole-body law's that writes its arms
   * itself (a gesture).
   *
   * Every goal is read as the plan perceives it (`ICarry.perceived`), so a
   * goal on another person reads them where the performer saw them when the
   * plan starts, never at a later second.
   *
   * The waypoints: the reach and the return spaced by the arc their blend
   * covers (`SPACING` of the farthest probe's travel, between `1 / LEAST`
   * and a frame), the hold at the least spacing (`LEAST` a second, the rate
   * a site at a daily reach's peak speed moves `SPACING` at); the solve then splits every interval that does not bound its
   * site's path or its probes' clearance (`HumanArmRefine`), down to the
   * frame grid at the finest, so a still hold keeps few waypoints and a
   * stroke as many as its motion needs. On the hold each arm's site is its
   * goal's contact in the world; a site on a segment of another arm of the
   * group rides that arm as it is solved.
   *
   * @param body The body.
   * @param span The span's instants.
   * @param carries The arms.
   * @param before The prefix posture at any second, accepting this same-body plan's synchronous FK/ROM loans through the shared posture signature.
   * @param plan The group's handover: its `warm` read for an earlier plan's solution of these arms, its `last` written with this plan's own when the optimiser ran. Absent, nothing is read or kept.
   * @returns Each arm's trajectory.
   * @throws {HumanRefusal} When no trajectory meets the constraints (`HumanArmTrajectory.solve`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the problem, the waypoints and their spacing, the sites and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The arms' whole action is first laid as an animation system lays it (`AutoMovieMotionHumanArmCourse`: a minimum-jerk effector course with a closed-form via-point, the rig's analytic fit at every instant continued from the last) and kept when the trajectory model's own reading admits it (`HumanArmTrajectory.admitted`); otherwise it seeds one trajectory optimisation (TrajOpt). Either is read off the very postures it is written on, so the plan is a constant of the action.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Waypoints, postures and poses, each arm's sites, the bases, one solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The waypoints are refined on the trajectory by what they must bound, never by a declared rate; the goal is read at every waypoint, not interpolated.
   * @evidence contracts/development/implementation.md#efficient-algorithms An admitted course costs one posture solve per hold instant, constant transport work and one model evaluation on the frame grid, with no optimiser round; the optimiser's waypoints are cut only on its fallback. Each raw posture, removed-arm base and perceived goal is read once per actual refinement instant. Native endpoint arm fits run once per arm/time for ready and relax; ready's initial guess shares that completed fit. A sole planned arm also reuses its exact removed-goal base for unchanged ARC travel sampling. Multiarm bases and all refinement/optimizer work remain native; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Same body, cached raw posture/goal and endpoint second prove fit equivalence within this synchronous plan. One genuine projector/exact FK getter reaches actual prefix reads, removed-arm bases and endpoint fits; FK also serves all original probes/sites. Single-arm at(t).pose equals reaching's removed-goal base; multiarm planners retain original actual requests. Issued provenance still needs exact checks.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This synchronous plan owns raw/base/site maps, at most two endpoint angle records per arm and one exact FK preparation until return/throw. Only completed fits publish; no global result/time cache is added. Returned trajectories use their existing playback factory and solved-waypoint data, retaining none of these maps/getters or preparation callbacks.
   */
  export function planned(
    body: IAutoMovieMotionHumanBody,
    span: IAutoMovieMotionHumanArmPlanned.ISpan,
    carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[],
    before: IAutoMovieMotionHumanActionPlan["posture"],
    plan?: Pick<IAutoMovieMotionHumanArmPlanned.ITogether, "warm" | "last" | "stretches">,
  ): Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Trajectory> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(body);
    // Each phrase is an interval cut into pieces, its own end left to the
    // next one; an empty interval (a hold that lasts to the end, a reach
    // that starts on its site) has no piece, and the last phrase closes on
    // its end itself.
    const times: number[] = [];
    const cut = (a: number, b: number, pieces: number, last: boolean): void => {
      for (let i: number = 0; i < pieces; ++i)
        times.push(a + ((b - a) * i) / pieces);
      if (last) times.push(b);
    };

    // A posture with the planned arms left out.
    const without = (p: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture => {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...p.limbs };
      for (const c of carries) delete limbs[`${c.side}Arm`];
      return { ...p, limbs };
    };

    // Each instant's posture so far and its pose with the planned arms left
    // out, the base each arm is read against, and each arm's goal there as
    // the plan perceives it, each read once however often the plan and its
    // refinement ask (each arm's goal by AutoMovieMotionHumanArmAimed).
    const read: Map<number, { posture: IAutoMovieMotionHumanPosture; pose: IAutoMoviePose }> = new Map();
    const at = (t: number): { posture: IAutoMovieMotionHumanPosture; pose: IAutoMoviePose } => {
      let found:
        | { posture: IAutoMovieMotionHumanPosture; pose: IAutoMoviePose } | undefined = read.get(t);
      if (found === undefined) {
        const posture: IAutoMovieMotionHumanPosture = before(t, undefined, resolution, projection);
        found = { posture, pose: resolveHumanPosture.seeded(body, without(posture),
          undefined, undefined, resolution, undefined, projection).pose };
        read.set(t, found);
      }
      return found;
    };
    const aimed: (a: number, t: number) => IAutoMovieHumanLimbGoal =
      AutoMovieMotionHumanArmAimed(carries, at, resolution, projection);
    const fits: Map<number, IAutoMovieMotionHumanArmAngles.IAngles>[] =
      carries.map((): Map<number, IAutoMovieMotionHumanArmAngles.IAngles> => new Map());

    /** Travel and the initial guess share only completed fits of the same cached endpoint inputs. */
    const fitted = (a: number, t: number): IAutoMovieMotionHumanArmAngles.IAngles => {
      let found: IAutoMovieMotionHumanArmAngles.IAngles | undefined = fits[a]!.get(t);
      if (found === undefined) {
        const p: IAutoMovieMotionHumanPosture = at(t).posture;
        const c: IAutoMovieMotionHumanArmPlanned.IPlanned = carries[a]!;
        // One planned arm stands alone on the base already resolved without
        // it: the rest of the body is that base's, so only the arm is fitted
        // (the limbs fit in order and nothing reads an arm fitted last).
        // Two planned arms neither of which rides the other are each the
        // same: the posture solve of one arm's goal, where the posture so
        // far gives the other planned arm no goal, fits that one arm on the
        // very base with the other arm as placed (`refitHumanPosture`). A
        // riding pair, or a posture that already aims the other arm, keeps
        // the posture solve.
        const apart: boolean =
          carries.length === 2 &&
          carries.every((o: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean => o.on === undefined) &&
          carries.every((o: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean => o === c || p.limbs[`${o.side}Arm`] === undefined);
        found = AutoMovieMotionHumanArmAngles.angles(carries.length === 1
          ? HumanLimbFit.fit(body, at(t).pose, `${c.side}Arm`, aimed(a, t), ["left", "right"],
              undefined, undefined, resolution).pose
          : apart
            ? HumanLimbFit.fit(body, at(t).pose, `${c.side}Arm`, aimed(a, t),
                [c.side === "left" ? "right" : "left"], undefined, undefined, resolution).pose
          : resolveHumanPosture.seeded(body,
              { ...p, limbs: { ...p.limbs, [`${c.side}Arm`]: aimed(a, t) } },
              undefined, undefined, resolution, undefined, projection).pose, c.side);
        fits[a]!.set(t, found);
      }
      return found;
    };
    const travel = (t: number, sign: -1 | 1): number => {
      let longest: number = 0;
      const p: IAutoMovieMotionHumanPosture = at(t).posture;
      carries.forEach((c: IAutoMovieMotionHumanArmPlanned.IPlanned, a: number): void => {
        const fit: IAutoMovieMotionHumanArmAngles.IAngles = fitted(a, t);
        const rest: IAutoMovieMotionHumanArmAngles.IAngles = sign === 1 ? c.rest : (c.back ?? c.rest);
        const duration: number = carries.length === 1
          ? AutoMovieMotionHumanArmObservation.reachingPose(body, at(t).pose, c.side, rest, fit, resolution)
          : reaching(body, p, c.side, rest, fit, resolution, projection);
        longest = Math.max(longest, (duration * HumanArmTrajectoryModel.SPEED_LIMIT) / 1.875);
      });
      return longest;
    };
    const spaced = (seconds: number, arc: number): number =>
      Math.min(
        Math.ceil(seconds / STEP),
        Math.max(
          Math.ceil(seconds * LEAST),
          Math.min(Math.ceil(arc / SPACING), TRANSPORT),
          1,
        ),
      );
    // The optimiser's first waypoints, cut only when the laid course is not
    // admitted.
    const waypoints: () => void = (): void => {
      cut(span.start, span.ready, spaced(span.ready - span.start, travel(span.ready, 1)), false);
      cut(span.ready, span.relax, span.relax > span.ready
        ? Math.max(1, Math.ceil((span.relax - span.ready) * LEAST)) : 0, false);
      cut(span.relax, span.end, spaced(span.end - span.relax, travel(span.relax, -1)), true);
    };

    // Each instant's base, one record however often the refinement reads it,
    // so the frames built on it are built once (`HumanArmFrame.of`).
    const bases: Map<number, HumanArmTrajectory.IProblem["bases"][number]> =
      new Map();
    const base = (t: number): HumanArmTrajectory.IProblem["bases"][number] => {
      let found: HumanArmTrajectory.IProblem["bases"][number] | undefined =
        bases.get(t);
      if (found === undefined) {
        const goals: IAutoMovieHumanLimbGoal[] = carries.map(
          (_: IAutoMovieMotionHumanArmPlanned.IPlanned, a: number): IAutoMovieHumanLimbGoal => aimed(a, t),
        );
        // On the hold the hand lies on what its goal lays it on: those
        // segments are its contact there, and obstacles on the way.
        const rests: IAutoMovieMotionHumanColliders.IPlaced[] = holding(t)
          ? goals.flatMap((goal: IAutoMovieHumanLimbGoal): IAutoMovieMotionHumanColliders.IPlaced[] => [...(goal.rests ?? [])])
          : [];
        found = {
          pose: at(t).pose,
          others: goals.flatMap((goal: IAutoMovieHumanLimbGoal): IAutoMovieMotionHumanColliders.IPlaced[] => [
            ...(goal.clear ?? []),
            ...(goal.rests ?? []),
          ]),
          ...(rests.length === 0 ? {} : { rests }),
        };
        bases.set(t, found);
      }
      return found;
    };
    const holding = (t: number): boolean =>
      t >= span.ready - 1e-9 && t <= span.relax + 1e-9;

    // Each arm's own fit at the hold's start, the optimiser's seed's first
    // start: fitted only once the laid course is refused, since an admitted
    // course reads no guess.
    let guesses: IAutoMovieMotionHumanArmAngles.IAngles[] | undefined;

    // Each arm's site at an instant, read once however often the refinement
    // reads the problem again: a refinement adds instants, and the site at
    // an instant already read does not change. The same record each time
    // also lets the solve keep what it built on it (`HumanArmTrajectoryContext.of`).
    const sited: Map<number, HumanArmTrajectory.ISite | undefined>[] =
      carries.map(
        (): Map<number, HumanArmTrajectory.ISite | undefined> => new Map(),
      );
    const problem = (
      waypoints: readonly number[],
    ): HumanArmTrajectory.IProblem => ({
      body,
      times: waypoints,
      share: carries[0]!.weight,
      arms: carries.map((c: IAutoMovieMotionHumanArmPlanned.IPlanned, a: number): HumanArmTrajectory.IArm => {
        const rider: number =
          c.on === undefined
            ? -1
            : carries.findIndex(
                (o: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean => o !== c && c.on!.startsWith(o.side),
              );
        // The site where the arm's goal puts it at an instant, on the hold.
        const located = (t: number): HumanArmTrajectory.ISite | undefined => {
          if (!holding(t)) return undefined;
          const pose: IAutoMoviePose = at(t).pose;
          const own: HumanArmTrajectory.ISite = AutoMovieMotionHumanArmObservation.site(
            body,
            pose,
            c,
            aimed(a, t),
            resolution,
          );
          if (rider < 0) return own;
          const lead: IAutoMovieMotionHumanArmPlanned.IPlanned = carries[rider]!;

          // A grip on an object both hands hold rides the lead hand's own
          // site, the hand as the plan puts it there: a closed chain
          // through the plan, not the hand as posed when it is read.
          if (c.grasp !== undefined && c.on!.endsWith("Hand")) {
            const held: HumanArmTrajectory.ISite = AutoMovieMotionHumanArmObservation.site(
              body,
              pose,
              lead,
              aimed(rider, t),
              resolution,
            );
            if (held.rotation !== undefined)
              return {
                ...own,
                on: {
                  ...AutoMovieMotionHumanArmRide.gripped(held, own),
                  arm: rider,
                },
              };
          }
          return {
            ...own,
            on: {
              ...AutoMovieMotionHumanArmRide.riding(
                body,
                pose,
                lead.side,
                c.on!,
                own.point,
                own.rotation,
              ),
              arm: rider,
            },
          };
        };
        const read = (t: number): HumanArmTrajectory.ISite | undefined => {
          if (!sited[a]!.has(t)) sited[a]!.set(t, located(t));
          return sited[a]!.get(t);
        };
        return {
          side: c.side,
          rest: c.rest,
          ...(c.back === undefined ? {} : { back: c.back }),
          ...(c.rests === undefined ? {} : { rests: c.rests }),
          ...(c.grasp === undefined ? {} : { grasp: c.grasp }),
          sites: waypoints.map(read),
          ...(guesses === undefined ? {} : { guess: guesses[a]! }),
        };
      }),
      bases: waypoints.map(
        (t: number): HumanArmTrajectory.IProblem["bases"][number] => base(t),
      ),
    });
    // The course an animation system lays (`AutoMovieMotionHumanArmCourse`),
    // kept when the model's own reading admits it; otherwise the
    // optimiser's seed.
    const laid: ReturnType<typeof AutoMovieMotionHumanArmCourse.course> =
      AutoMovieMotionHumanArmCourse.course({
        body, span, arms: carries, at, aimed, problem, resolution,
      });
    if (laid?.admitted !== true) {
      guesses = carries.map(
        (_: IAutoMovieMotionHumanArmPlanned.IPlanned, a: number): IAutoMovieMotionHumanArmAngles.IAngles =>
          fitted(a, span.ready),
      );
      waypoints();
    }
    let solved: IAutoMovieMotionHumanArmTrajectory.Trajectory[];
    if (laid?.admitted === true) solved = laid.trajectories;
    else {
      // An earlier plan's solution of these arms, carried onto this span,
      // starts the solve; this plan's own is left for the next.
      const key: string = carries.map((c: IAutoMovieMotionHumanArmPlanned.IPlanned): string => c.side).join("+");
      const earlier: IWarm | undefined = plan?.warm?.get(key);
      const result: HumanArmTrajectory.ISolved = HumanArmTrajectory.solve(
        problem, times, laid,
        earlier === undefined ? undefined : AutoMovieMotionHumanArmRetimed(earlier, span),
        plan?.stretches === true,
      );
      if (plan !== undefined)
        (plan.last ??= new Map()).set(key, { span, state: result.state });
      solved = result.trajectories;
    }
    return new Map(
      carries.map(
        (
          c: IAutoMovieMotionHumanArmPlanned.IPlanned,
          a: number,
        ): [AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Trajectory] => [
          c.side,
          solved[a]!,
        ],
      ),
    );
  }

  /**
   * Observed target motion since the plan perceived it, in world metres.
   *
   * AutoMovieMotionHumanArmObservation.moved owns the original same-base
   * perceived/current site comparison and its error/contact/base result.
   * This alias adds no wrapper or retained observation state.
   */
  export const moved: typeof AutoMovieMotionHumanArmObservation.moved = AutoMovieMotionHumanArmObservation.moved;
}

/** The spacing of the trajectory's waypoints, seconds at most: the frame grid (`AutoMovieMotionHumanArmCourse.STEP`). */
const STEP: number = AutoMovieMotionHumanArmCourse.STEP;

/** The farthest probe's travel between two waypoints of a reach, metres: the audit's travel bound over one of its twenty-fourth-second steps (`HumanArmTrajectoryModel.SPEED_LIMIT`). */
const SPACING: number = HumanArmTrajectoryModel.SPEED_LIMIT / 24;

/** A daily reach's peak hand speed, metres a second (J NeuroEng Rehabil 2006 3:18). */
const PEAK: number = 0.55;

/** The least waypoints a second of a reach, a return or a hold: a site moving as fast as a daily reach's peak travels at most `SPACING` between two of them. */
const LEAST: number = Math.ceil(PEAK / SPACING);

/** The intervals a reach or a return is first cut into at most, by its arc: TrajOpt plans an arm's whole path on eleven timesteps, ten intervals (Schulman et al. 2013, section VI); the solve adds knots where the played trajectory's frame-grid reading asks (`HumanArmTrajectoryAdmission`). */
const TRANSPORT: number = 10;


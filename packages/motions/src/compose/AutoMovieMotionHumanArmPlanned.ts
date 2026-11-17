import type { IAutoMoviePose } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import type { HumanColliders } from "../posture/HumanColliders";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import type { AutoMovieMotionHumanArmCarry } from "./AutoMovieMotionHumanArmCarry";
import { AutoMovieMotionHumanArmObservation } from "./AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanArmRide } from "./AutoMovieMotionHumanArmRide";

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
   * The instants of an action an arm is planned over, seconds since the
   * action's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each instant's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The reach, the hold and the return are bounded by four instants of the action's clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by `planned`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds, not clock names, so a law without a clock (a gesture) fits.
   */
  export interface ISpan {
    /** The arm leaves its rest. */
    start: number;

    /** The hand is on its site. */
    ready: number;

    /** The hand leaves its site; `end` itself for a hand that stays on it to the end. */
    relax: number;

    /** The arm is back at rest, or, for a hand that stays on its site, the span ends with it there. */
    end: number;
  }

  /**
   * Arms moved over one span as one trajectory problem: each carry that
   * names the group joins it, and the first to be written solves it for all.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States who joins and who solves.
   * @evidence contracts/development/design.md#principled-representation Two arms whose paths are coupled are one problem (Erdmann and Lozano-Pérez 1987), so the group holds them and their one solution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members, the solution and the guard against re-entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The solution is kept so every member reads the same plan.
   */
  export interface ITogether {
    /** The carries of the group, in the order they joined. */
    carries: AutoMovieMotionHumanArmCarry.ICarry[];

    /** Each arm's trajectory, once solved. */
    solved?: Map<HumanHand.Side, HumanArmTrajectory.Trajectory>;

    /** Whether the group is being solved, so a member asked during the solve is refused instead of solved twice. */
    solving?: boolean;
  }

  /**
   * One arm of `planned`: the carry's own members, and the arm it returns to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is taken from the carry and what is added.
   * @evidence contracts/development/design.md#principled-representation An arm's task: its rest, its goal, its weight and its declared contacts, and the arm it ends at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The carry's members `planned` reads, and `back`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The members are the carry's own by `Pick`, not restated.
   */
  export interface IPlanned extends Pick<
    AutoMovieMotionHumanArmCarry.ICarry,
    | "side"
    | "rest"
    | "goal"
    | "perceived"
    | "weight"
    | "rests"
    | "grasp"
    | "disc"
    | "on"
  > {
    /** The arm at the end of the span, where it returns to another arm than it left; `rest` when absent. */
    back?: AutoMovieMotionHumanArmAngles.IAngles;
  }

  /**
   * A group for arms moved together.
   *
   * @returns The empty group.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation A group starts empty; its carries join it as they are built.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: no member is assumed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The group holds its carries and their solution, released with the primitives that close over it.
   */
  export function together(): ITogether {
    return { carries: [] };
  }

  /**
   * The span a carry's weight states: where it leaves 0 (`start`), first
   * reaches 1 (`ready`), last leaves 1 (`relax`) and is back at 0 (`end`),
   * or `relax` and `end` at the window's end for a weight that holds 1 to
   * it. Each instant is bracketed on a 1/240 s grid of the window and
   * bisected within its bracket to 1e-12 s.
   *
   * @param weight The carry's weight, 0 at its rest and 1 on its goal.
   * @param from The window's first second.
   * @param to The window's last second.
   * @returns The span; none for a weight that states no single reach: one that never leaves 0 or never reaches 1, starts off 0, ends between its ends, or leaves 0 again after it returned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four instants, the hold to the end, the precision and every case with no span.
   * @evidence contracts/development/implementation.md#principled-implementation A weight is a time course of a reach, so its instants are where it crosses its ends; a crossing bracketed by two samples is found by bisection to the precision asked.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan for the brackets and one bisection per instant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A weight with two reaches or none is not given a span: its law states its own (`AutoMovieMotionHumanArmCarry.ICarry.span`).
   * @evidence contracts/development/implementation.md#efficient-algorithms 240 samples a second of window and forty-odd reads per instant, once per carry.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per carry by `carried`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function stated(
    weight: (seconds: number) => number,
    from: number,
    to: number,
  ): ISpan | undefined {
    const count: number = Math.max(1, Math.ceil((to - from) * 240));
    const at = (i: number): number => from + ((to - from) * i) / count;
    const w: number[] = Array.from(
      { length: count + 1 },
      (_: unknown, i: number): number => weight(at(i)),
    );
    // The first sample past a condition, from a sample on.
    const first = (since: number, met: (v: number) => boolean): number => {
      for (let i: number = since; i <= count; ++i) if (met(w[i]!)) return i;
      return -1;
    };
    // The instant between two samples where the condition starts to hold.
    const crossing = (i: number, met: (v: number) => boolean): number => {
      let lo: number = at(i - 1);
      let hi: number = at(i);
      while (hi - lo > 1e-12) {
        const mid: number = (lo + hi) / 2;
        if (met(weight(mid))) hi = mid;
        else lo = mid;
      }
      return hi;
    };
    const moved = (v: number): boolean => v > 0;
    const arrived = (v: number): boolean => v >= 1;
    const left = (v: number): boolean => v < 1;
    const rested = (v: number): boolean => v <= 0;
    const leaves: number = first(0, moved);
    if (leaves <= 0) return undefined;
    const reaches: number = first(leaves, arrived);
    if (reaches < 0) return undefined;
    // The last second at rest before it moves, the start.
    const start: number = crossing(leaves, moved);
    const ready: number = crossing(reaches, arrived);
    const releases: number = first(reaches, left);
    if (releases < 0) return { start, ready, relax: to, end: to };
    const returns: number = first(releases, rested);
    if (returns < 0 || first(returns, moved) >= 0) return undefined;
    return {
      start,
      ready,
      relax: crossing(releases, left),
      end: crossing(returns, rested),
    };
  }

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
   * covers (`SPACING` of the farthest probe's travel, between a sixth and a
   * thirtieth of a second), the hold at the least spacing (`LEAST`, six a
   * second); the solve then splits every interval that does not bound its
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
   * @returns Each arm's trajectory.
   * @throws {HumanRefusal} When no trajectory meets the constraints (`HumanArmTrajectory.solve`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the problem, the waypoints and their spacing, the sites and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The arms' whole action is one trajectory optimisation (TrajOpt), read off the very postures it is written on, so the plan is a constant of the action.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Waypoints, postures and poses, each arm's sites, the bases, one solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The waypoints are refined on the trajectory by what they must bound, never by a declared rate; the goal is read at every waypoint, not interpolated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each raw posture, removed-arm base and perceived goal is read once per actual refinement instant. Native endpoint arm fits run once per arm/time for ready and relax; ready's initial guess shares that completed fit. A sole planned arm also reuses its exact removed-goal base for unchanged ARC travel sampling. Multiarm bases and all refinement/optimizer work remain native; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Same body, cached raw posture/goal and endpoint second prove fit equivalence within this synchronous plan. One genuine projector/exact FK getter reaches actual prefix reads, removed-arm bases and endpoint fits; FK also serves all original probes/sites. Single-arm at(t).pose equals reaching's removed-goal base; multiarm planners retain original actual requests. Issued provenance still needs exact checks.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This synchronous plan owns raw/base/site maps, at most two endpoint angle records per arm and one exact FK preparation until return/throw. Only completed fits publish; no global result/time cache is added. Returned trajectories use their existing playback factory and solved-waypoint data, retaining none of these maps/getters or preparation callbacks.
   */
  export function planned(
    body: IHumanBody,
    span: ISpan,
    carries: readonly IPlanned[],
    before: IHumanActionPlan["posture"],
  ): Map<HumanHand.Side, HumanArmTrajectory.Trajectory> {
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
    const without = (p: IHumanPosture): IHumanPosture => {
      const limbs: IHumanPosture["limbs"] = { ...p.limbs };
      for (const c of carries) delete limbs[`${c.side}Arm`];
      return { ...p, limbs };
    };

    // Each instant's posture so far and its pose with the planned arms left
    // out, the base each arm is read against, and each arm's goal there as
    // the plan perceives it, each read once however often the plan and its
    // refinement ask.
    const read: Map<number, { posture: IHumanPosture; pose: IAutoMoviePose }> =
      new Map();
    const at = (
      t: number,
    ): { posture: IHumanPosture; pose: IAutoMoviePose } => {
      let found: { posture: IHumanPosture; pose: IAutoMoviePose } | undefined =
        read.get(t);
      if (found === undefined) {
        const posture: IHumanPosture = before(t, undefined, resolution, projection);
        found = { posture, pose: resolveHumanPosture.seeded(body, without(posture),
          undefined, undefined, resolution, undefined, projection).pose };
        read.set(t, found);
      }
      return found;
    };
    const goals: Map<number, IHumanPosture.IGoal>[] = carries.map(
      (): Map<number, IHumanPosture.IGoal> => new Map(),
    );
    const aimed = (a: number, t: number): IHumanPosture.IGoal => {
      let found: IHumanPosture.IGoal | undefined = goals[a]!.get(t);
      if (found === undefined)
        goals[a]!.set(t, (found = AutoMovieMotionHumanArmObservation.aim(carries[a]!, at(t).posture, t, resolution, projection)));
      return found;
    };
    const fits: Map<number, AutoMovieMotionHumanArmAngles.IAngles>[] = carries.map(
      (): Map<number, AutoMovieMotionHumanArmAngles.IAngles> => new Map(),
    );

    /** Travel and the initial guess share only completed fits of the same cached endpoint inputs. */
    const fitted = (a: number, t: number): AutoMovieMotionHumanArmAngles.IAngles => {
      let found: AutoMovieMotionHumanArmAngles.IAngles | undefined = fits[a]!.get(t);
      if (found === undefined) {
        const p: IHumanPosture = at(t).posture;
        const c: IPlanned = carries[a]!;
        found = AutoMovieMotionHumanArmAngles.angles(resolveHumanPosture.seeded(body,
          { ...p, limbs: { ...p.limbs, [`${c.side}Arm`]: aimed(a, t) } },
          undefined, undefined, resolution, undefined, projection).pose, c.side);
        fits[a]!.set(t, found);
      }
      return found;
    };
    const travel = (t: number, sign: -1 | 1): number => {
      let longest: number = 0;
      const p: IHumanPosture = at(t).posture;
      carries.forEach((c: IPlanned, a: number): void => {
        const fit: AutoMovieMotionHumanArmAngles.IAngles = fitted(a, t);
        const rest: AutoMovieMotionHumanArmAngles.IAngles = sign === 1 ? c.rest : (c.back ?? c.rest);
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
        Math.max(Math.ceil(seconds * LEAST), Math.ceil(arc / SPACING), 1),
      );
    cut(
      span.start,
      span.ready,
      spaced(span.ready - span.start, travel(span.ready, 1)),
      false,
    );
    cut(
      span.ready,
      span.relax,
      span.relax > span.ready
        ? Math.max(1, Math.ceil((span.relax - span.ready) * LEAST))
        : 0,
      false,
    );
    cut(
      span.relax,
      span.end,
      spaced(span.end - span.relax, travel(span.relax, -1)),
      true,
    );

    // Each instant's base, one record however often the refinement reads it,
    // so the frames built on it are built once (`HumanArmFrame.of`).
    const bases: Map<number, HumanArmTrajectory.IProblem["bases"][number]> =
      new Map();
    const base = (t: number): HumanArmTrajectory.IProblem["bases"][number] => {
      let found: HumanArmTrajectory.IProblem["bases"][number] | undefined =
        bases.get(t);
      if (found === undefined) {
        found = {
          pose: at(t).pose,
          others: carries.flatMap(
            (_: IPlanned, a: number): HumanColliders.IPlaced[] => {
              const goal: IHumanPosture.IGoal = aimed(a, t);
              return [...(goal.clear ?? []), ...(goal.rests ?? [])];
            },
          ),
        };
        bases.set(t, found);
      }
      return found;
    };
    const holding = (t: number): boolean =>
      t >= span.ready - 1e-9 && t <= span.relax + 1e-9;
    const guesses: AutoMovieMotionHumanArmAngles.IAngles[] = carries.map(
      (_: IPlanned, a: number): AutoMovieMotionHumanArmAngles.IAngles => fitted(a, span.ready),
    );

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
      arms: carries.map((c: IPlanned, a: number): HumanArmTrajectory.IArm => {
        const rider: number =
          c.on === undefined
            ? -1
            : carries.findIndex(
                (o: IPlanned): boolean => o !== c && c.on!.startsWith(o.side),
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
          const lead: IPlanned = carries[rider]!;

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
          guess: guesses[a]!,
        };
      }),
      bases: waypoints.map(
        (t: number): HumanArmTrajectory.IProblem["bases"][number] => base(t),
      ),
    });
    const solved: HumanArmTrajectory.Trajectory[] = HumanArmTrajectory.solve(
      problem,
      times,
    );
    return new Map(
      carries.map(
        (
          c: IPlanned,
          a: number,
        ): [HumanHand.Side, HumanArmTrajectory.Trajectory] => [
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

/** The spacing of the trajectory's waypoints, seconds at most: the frame grid, a thirtieth of a second. */
const STEP: number = 1 / 30;

/** The least waypoints a second of a reach, a return or a hold, the swept clearance's spacing. */
const LEAST: number = 6;

/** The farthest probe's travel between two waypoints of a reach, metres. */
const SPACING: number = 0.08;


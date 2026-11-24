import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmGeometry } from "../posture/HumanArmGeometry";
import { HumanArmSeed } from "../posture/HumanArmSeed";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryContext } from "../posture/HumanArmTrajectoryContext";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { certifyHumanArmTracks } from "../posture/certifyHumanArmTracks";
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
 * The farthest probe's travel between two waypoints of a reach first cut,
 * metres (provisional: a sampling density, not a bound; the solve splits any
 * interval its frame-grid reading fails in).
 */
const SPACING: number = 0.08;

/**
 * A daily reach's peak hand speed, metres a second (J NeuroEng Rehabil 2006
 * 3:18).
 */
const PEAK: number = 0.55;

/**
 * An arm's whole action planned as one trajectory (`HumanArmTrajectory`): its
 * reach from rest, its hold on the goal's site and its return, read off the
 * posture so far and solved once, alone or with the other arm of the same
 * span.
 */
export namespace AutoMovieMotionHumanArmPlanned {
  /**
   * The least waypoints a second of a reach, a return or a hold: a site moving
   * as fast as a daily reach's peak travels at most `SPACING` between two of
   * them.
   */
  export const LEAST: number = Math.ceil(PEAK / SPACING);

  /**
   * An earlier plan's solution of a group's arms, handed to the next plan of
   * the same action (`IAutoMovieMotionHumanArmPlanned.IWarm`).
   */
  export type IWarm = IAutoMovieMotionHumanArmPlanned.IWarm;

  /**
   * A group for arms moved together.
   *
   * @param handover The action's handover between its plans
   *   (`IHumanActionContext.handover`): the group reads the last plan's
   *   solutions from it and writes its own into it. Absent, the group takes the
   *   handover of the action whose plan is in scope (`within`), and hands
   *   nothing on outside one.
   * @param stretches Whether the group's span is its law's own, lengthened by a
   *   slower tempo (`ITogether.stretches`).
   * @param tempo The explicit replanning multiplier on elapsed time, 1 by
   *   default.
   * @returns The empty group.
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

  /**
   * Run one plan of an action with its handover in scope: every group the plan
   * makes (`together`, the default group of a carry included) reads the
   * action's last plan's solutions and writes its own, keyed by its place among
   * the plan's groups, so a replan at a slower time (`HumanPerformanceTempo`)
   * starts each solve where the last plan's ended. Scopes nest: an inner plan's
   * groups are its own, and the enclosing scope is restored on return or throw.
   * A group of the plan whose solve refuses names itself in `refusal`, so the
   * replan can tell one group's need from another's.
   *
   * @param handover The action's handover (`IHumanActionContext.handover`);
   *   absent, the plan runs with no scope.
   * @param run The plan.
   * @param refusal Where the group whose solve refused is named; absent, none
   *   is named.
   * @returns What the plan returns.
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

  /** The group of a plan whose solve refused (`within`). */
  export interface IRefusal {
    /**
     * The refusing group's handover key (`IWarm`'s key with its ordinal);
     * absent until a group of the plan refuses.
     */
    group?: string;

    /** What that group's solve threw. */
    error?: unknown;
  }

  /**
   * The plan in scope (`within`): its action's handover, how many groups it has
   * made and where a refusing group is named.
   */
  interface IScope {
    /** The action's handover. */
    handover: IAutoMovieMotionHumanActionContext.IHandover;

    /** The groups the plan has made so far. */
    made: number;

    /** Where a refusing group is named. */
    refusal?: IRefusal;
  }

  /** The plan in scope, while one runs (`within`). */
  let scope: IScope | undefined;

  /**
   * The span a carry's weight states, its four instants read off the weight's
   * crossings of 0 and 1 (`AutoMovieMotionHumanArmStated`, which states the
   * precision and the weights that state no span). The alias transforms no
   * input and adds no state.
   */
  export const stated: typeof AutoMovieMotionHumanArmStated =
    AutoMovieMotionHumanArmStated;

  /**
   * Physical reach-duration observation, shared with touch-law planning.
   *
   * AutoMovieMotionHumanArmObservation.reaching owns the unchanged actual arc
   * samples, speed bound and result in seconds. The alias transforms no input
   * and adds no wrapper, evaluated result or retained query state.
   */
  export const reaching: typeof AutoMovieMotionHumanArmObservation.reaching =
    AutoMovieMotionHumanArmObservation.reaching;
  /** One instant of a hold to check: the arms holding there and the second. */
  export interface IStill {
    /** The arms, each with its goal on its hold at the second. */
    carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[];

    /** The second, the plan's own. */
    seconds: number;
  }

  /**
   * Whether the arms can hold at one instant: the course's own still problem
   * there (`HumanArmSeed.held`), on the bases, sites and starts the course
   * would read at that instant (`planned` with `still`), so what a law admits
   * by it is what the course can place.
   *
   * @param body The body.
   * @param still The arms and the second.
   * @param before The prefix posture at any second, the arms' goals read off
   *   it.
   * @returns Whether a configuration holds every hand on its site with every
   *   arm clear there.
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
      if (error instanceof HumanRefusal) return false;
      throw error;
    }
  }

  /**
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
   *
   * @param body The body.
   * @param span The span's instants.
   * @param carries The arms.
   * @param before The prefix posture at any second, accepting this same-body
   *   plan's synchronous FK/ROM loans through the shared posture signature.
   * @param plan The group's handover: its `warm` read for an earlier plan's
   *   solution of these arms, its `last` written with this plan's own when the
   *   optimiser ran, or with the path a refusal for time was reached at
   *   (`IMirrorTold.state`), which the replan at the slower time starts from.
   *   Absent, nothing is read or kept.
   * @param inheritedPace Exact original group pace, supplied only for a trial
   *   of one member.
   * @param still Whether only the hold's instant (`span.ready`) is solved as
   *   the course's still problem, refusing as the course would there, and no
   *   course is laid (`stands`).
   * @returns Each arm's trajectory.
   * @throws {HumanRefusal} When no trajectory meets the constraints
   *   (`HumanArmTrajectory.solve`).
   */
  export function planned(
    body: IAutoMovieMotionHumanBody,
    span: IAutoMovieMotionHumanArmPlanned.ISpan,
    carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[],
    before: IAutoMovieMotionHumanActionPlan["posture"],
    plan?: Pick<
      IAutoMovieMotionHumanArmPlanned.ITogether,
      "warm" | "last" | "stretches" | "tempo" | "ordinal"
    >,
    inheritedPace?: (seconds: number) => number,
    still?: boolean,
  ): Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Trajectory> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
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
    const without = (
      p: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => {
      if (
        carries.every(
          (carry: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
            p.limbs[`${carry.side}Arm`] === undefined,
        )
      )
        return p;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...p.limbs };
      for (const c of carries) delete limbs[`${c.side}Arm`];
      return { ...p, limbs };
    };

    // Each instant's posture so far and its pose with the planned arms left
    // out, the base each arm is read against, and each arm's goal there as
    // the plan perceives it, each read once however often the plan and its
    // refinement ask (each arm's goal by AutoMovieMotionHumanArmAimed).
    const read: Map<
      number,
      { posture: IAutoMovieMotionHumanPosture; pose: IAutoMoviePose }
    > = new Map();
    // The instant resolved last and its limbs' seeds: an instant within a
    // frame of it continues those fits instead of sweeping every swivel
    // again, the frame-to-frame coherence an animation system's IK keeps
    // (Aristidou et al. 2018, "Inverse kinematics techniques in computer
    // graphics: a survey", Comput. Graph. Forum 37:35, section 7; the
    // feasible swivel nearest the previous one, Tolani, Goswami and Badler
    // 2000, section 3.2.4). An instant farther from it is solved cold.
    let latest: ILatest | undefined;
    const at = (
      t: number,
    ): { posture: IAutoMovieMotionHumanPosture; pose: IAutoMoviePose } => {
      let found:
        | { posture: IAutoMovieMotionHumanPosture; pose: IAutoMoviePose }
        | undefined = read.get(t);
      if (found === undefined) {
        const posture: IAutoMovieMotionHumanPosture = before(
          t,
          undefined,
          resolution,
          projection,
        );
        const near: IAutoMovieMotionHumanResolveHumanPosture.INear =
          latest !== undefined && Math.abs(t - latest.seconds) <= CONTINUED
            ? continuing(latest.seeds)
            : {};
        const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
          resolveHumanPosture.seeded(
            body,
            without(posture),
            undefined,
            near,
            resolution,
            undefined,
            projection,
          );
        found = { posture, pose: solved.pose };
        latest = { seconds: t, seeds: solved.seeds };
        read.set(t, found);
      }
      return found;
    };
    const aimed: (a: number, t: number) => IAutoMovieHumanLimbGoal =
      AutoMovieMotionHumanArmAimed(carries, at, resolution, projection);
    const fits: Map<number, IAutoMovieMotionHumanArmAngles.IAngles>[] =
      carries.map(
        (): Map<number, IAutoMovieMotionHumanArmAngles.IAngles> => new Map(),
      );

    /**
     * Travel and the initial guess share only completed fits of the same cached
     * endpoint inputs.
     */
    const fitted = (
      a: number,
      t: number,
    ): IAutoMovieMotionHumanArmAngles.IAngles => {
      let found: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
        fits[a]!.get(t);
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
          carries.every(
            (o: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
              o.on === undefined,
          ) &&
          carries.every(
            (o: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
              o === c || p.limbs[`${o.side}Arm`] === undefined,
          );
        found = AutoMovieMotionHumanArmAngles.angles(
          carries.length === 1
            ? HumanLimbFit.fit(
                body,
                at(t).pose,
                `${c.side}Arm`,
                aimed(a, t),
                ["left", "right"],
                undefined,
                undefined,
                resolution,
              ).pose
            : apart
              ? HumanLimbFit.fit(
                  body,
                  at(t).pose,
                  `${c.side}Arm`,
                  aimed(a, t),
                  [c.side === "left" ? "right" : "left"],
                  undefined,
                  undefined,
                  resolution,
                ).pose
              : resolveHumanPosture.seeded(
                  body,
                  {
                    ...p,
                    limbs: { ...p.limbs, [`${c.side}Arm`]: aimed(a, t) },
                  },
                  undefined,
                  undefined,
                  resolution,
                  undefined,
                  projection,
                ).pose,
          c.side,
        );
        fits[a]!.set(t, found);
      }
      return found;
    };
    const travel = (t: number, sign: -1 | 1): number => {
      let longest: number = 0;
      const p: IAutoMovieMotionHumanPosture = at(t).posture;
      carries.forEach(
        (c: IAutoMovieMotionHumanArmPlanned.IPlanned, a: number): void => {
          const fit: IAutoMovieMotionHumanArmAngles.IAngles = fitted(a, t);
          const rest: IAutoMovieMotionHumanArmAngles.IAngles =
            sign === 1 ? c.rest : (c.back ?? c.rest);
          // The longest probe arc of the blend, read on the base without this
          // arm: the planner's own where it plans one arm, solved here for two.
          const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...p.limbs };
          delete limbs[`${c.side}Arm`];
          const base: IAutoMoviePose =
            carries.length === 1
              ? at(t).pose
              : resolveHumanPosture.seeded(
                  body,
                  { ...p, limbs },
                  undefined,
                  undefined,
                  resolution,
                  undefined,
                  projection,
                ).pose;
          longest = Math.max(
            longest,
            AutoMovieMotionHumanArmObservation.longest(
              body,
              base,
              c.side,
              rest,
              fit,
              resolution,
            ),
          );
        },
      );
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
      // An arm's own hold begins and ends on waypoints of its own, and every
      // instant that carries a pose constraint (`ISpan.knots`) is a waypoint,
      // as trajopt imposes a pose term at a timestep (github.com/joschu/
      // trajopt, `src/trajopt/problem_description.cpp`; Schulman et al. 2014,
      // section VII-B).
      const own: number[] = [...(span.knots ?? [])];
      for (const c of carries)
        if (c.span !== undefined) own.push(c.span.ready, c.span.relax);
      for (const t of own)
        if (
          t > span.start &&
          t < span.end &&
          !times.some((u: number): boolean => Math.abs(u - t) < 1e-9)
        )
          times.push(t);
      times.sort((a: number, b: number): number => a - b);
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
          (
            _: IAutoMovieMotionHumanArmPlanned.IPlanned,
            a: number,
          ): IAutoMovieHumanLimbGoal => aimed(a, t),
        );
        // On the hold the hand lies on what its goal lays it on: those
        // segments are its contact there, and obstacles on the way. What no
        // human body carries (a prop, an animal) is kept clear of too.
        found = AutoMovieMotionHumanArmObservation.based(
          at(t).pose,
          goals,
          carries.map((c: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
            holding(c, t),
          ),
        );
        bases.set(t, found);
      }
      return found;
    };
    // Each arm holds over its own span where it states one (a hold handed
    // from one hand to the other), the group's otherwise.
    const holding = (
      c: IAutoMovieMotionHumanArmPlanned.IPlanned,
      t: number,
    ): boolean => {
      const own: IAutoMovieMotionHumanArmPlanned.ISpan = c.span ?? span;
      return t >= own.ready - 1e-9 && t <= own.relax + 1e-9;
    };

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
      ...(carries.some((arm) => arm.on !== undefined)
        ? {
            material: { at: base, bones: carries.map((arm) => arm.on) },
          }
        : {}),
      share: carries[0]!.weight,
      arms: carries.map(
        (
          c: IAutoMovieMotionHumanArmPlanned.IPlanned,
          a: number,
        ): HumanArmTrajectory.IArm => {
          const rider: number =
            c.on === undefined
              ? -1
              : carries.findIndex(
                  (o: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
                    o !== c && c.on!.startsWith(o.side),
                );
          // The site where the arm's goal puts it at an instant, on the hold.
          const located = (t: number): HumanArmTrajectory.ISite | undefined => {
            if (!holding(c, t)) return undefined;
            const pose: IAutoMoviePose = at(t).pose;
            const own: HumanArmTrajectory.ISite =
              AutoMovieMotionHumanArmObservation.site(
                body,
                pose,
                c,
                aimed(a, t),
                resolution,
              );
            if (rider < 0) return own;
            const lead: IAutoMovieMotionHumanArmPlanned.IPlanned =
              carries[rider]!;

            // A grip on an object both hands hold rides the lead hand's own
            // site, the hand as the plan puts it there: a closed chain
            // through the plan, not the hand as posed when it is read.
            if (c.grasp !== undefined && c.on!.endsWith("Hand")) {
              const held: HumanArmTrajectory.ISite =
                AutoMovieMotionHumanArmObservation.site(
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
        },
      ),
      bases: waypoints.map(
        (t: number): HumanArmTrajectory.IProblem["bases"][number] => base(t),
      ),
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
        guesses = carries.map(
          (
            c: IAutoMovieMotionHumanArmPlanned.IPlanned,
            a: number,
          ): IAutoMovieMotionHumanArmAngles.IAngles =>
            span.ready <= span.start ? c.rest : fitted(a, span.ready),
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
          if (scope?.refusal !== undefined) {
            scope.refusal.group = key;
            scope.refusal.error = error;
          }
          throw error;
        }
        if (plan !== undefined)
          (plan.last ??= new Map()).set(key, { span, state: result.state });
        solved = result.trajectories;
      }
    }
    return new Map(
      carries.map(
        (
          c: IAutoMovieMotionHumanArmPlanned.IPlanned,
          a: number,
        ): [
          AutoMovieHumanSide,
          IAutoMovieMotionHumanArmTrajectory.Trajectory,
        ] => [c.side, solved[a]!],
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
        if (error === outside || error instanceof HumanRefusal)
          return undefined;
        throw error;
      }
    }
  }

  /**
   * Observed target motion since the plan perceived it, in world metres.
   *
   * AutoMovieMotionHumanArmObservation.moved owns the original same-base
   * perceived/current site comparison and its error/contact/base result. This
   * alias adds no wrapper or retained observation state.
   */
  export const moved: typeof AutoMovieMotionHumanArmObservation.moved =
    AutoMovieMotionHumanArmObservation.moved;
}

/**
 * The spacing of the trajectory's waypoints, seconds at most: the frame grid
 * (`AutoMovieMotionHumanArmCourse.STEP`).
 */
const STEP: number = AutoMovieMotionHumanArmCourse.STEP;

/**
 * How far from the instant resolved last an instant's base continues its fits,
 * seconds: a frame of the grid and a half, so the next frame does and a
 * refinement's far instant does not.
 */
const CONTINUED: number = 1.5 * STEP;

/**
 * The instant whose base was resolved last and the seed each of its limbs' fits
 * chose.
 */
interface ILatest {
  /** Its second. */
  seconds: number;

  /** Each fitted limb's seed there. */
  seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"];
}

/**
 * Each limb's fit a frame away continued from its seed, refined to the cold
 * sweep's own resolution; a limb with no seed is solved cold.
 */
function continuing(
  seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"],
): IAutoMovieMotionHumanResolveHumanPosture.INear {
  const out: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> = {};
  for (const [limb, seed] of Object.entries(seeds) as [
    AutoMovieHumanLimb,
    IAutoMovieSwivelSeed | null | undefined,
  ][])
    if (seed !== null && seed !== undefined)
      out[limb] = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
  return out;
}

/**
 * The intervals a reach or a return is first cut into at most, by its arc:
 * TrajOpt plans an arm's whole path on eleven timesteps, ten intervals
 * (Schulman et al. 2013, section VI); the solve adds knots where the played
 * trajectory's frame-grid reading asks (`HumanArmTrajectoryAdmission`).
 */
const TRANSPORT: number = 10;

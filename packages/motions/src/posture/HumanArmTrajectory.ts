import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmTrajectoryAdmission as Admission } from "./HumanArmTrajectoryAdmission";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/**
 * A performer's arms over one action as one trajectory optimisation, in
 * TrajOpt's formulation (Schulman et al. 2014, "Motion planning with
 * sequential convex optimization and convex collision checking", IJRR
 * 33:1251): the arms' joint-space knots over the reach, the hold and the
 * return are the variables, the objective and the constraints are
 * `HumanArmTrajectoryModel`'s, and the problem is solved by penalty
 * sequential convex optimisation with a trust region (TrajOpt's Algorithm
 * 1, `HumanArmOptimiser`) from a laid course or from a seed whose hold is
 * solved by inverse kinematics and whose reach and return are a sampling
 * planner's clear paths (`HumanArmSeed`). The knots are few, and the
 * trajectory played back between them is admitted on the frame grid by the
 * model's own evaluation (`HumanArmTrajectoryAdmission`), the knots refined
 * where that reading fails. Two arms that move over one span are one
 * problem, their probes kept clear of each other as they both move:
 * planning one after the other is incomplete where their paths are coupled
 * (Erdmann and Lozano-Pérez 1987, Algorithmica 2:477). A problem whose first
 * arm is the left is solved as its mirror image
 * (`HumanArmTrajectoryMirror`), so mirrored scenes give mirrored paths. A
 * problem still infeasible at the last penalty is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the joint-space trajectory, penalty solve, seeds, frame-grid admission and refinement, paired-arm constraints, mirror convention and refusal; solve documents the returned reader's narrower lifetime.
 * @evidence contracts/development/design.md#principled-representation One problem owns the fixed rig, sampled bases/sites and joint-space variables during optimisation; playback needs only the existing setup list, final times and solved coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The site alias, arm/problem inputs, trajectory callback, the laid course's record and the two entries serve ArmPlanned and ArmCourse; the module-private playback factory exposes no optimiser or cache API.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains the model's constraints, the mirror rules and the actual optimisation; no sample, tolerance, pose history or alternative solver is substituted.
 */
export namespace HumanArmTrajectory {
  /**
   * The hand on its site at a hold waypoint (`M.ISite`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the existing model-owned site and its hold-waypoint role.
   * @evidence contracts/development/design.md#principled-representation Reuses the model's point, orientation and contact declaration instead of duplicating them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ArmPlanned produces these sites and the trajectory context/model consume them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias adds no validation, sampled replacement or broader contact guarantee.
   */
  export type ISite = M.ISite;

  /**
   * One arm's task.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States side, first/last rest, waypoint sites, optional IK guess, declared rests and paired grasp.
   * @evidence contracts/development/design.md#principled-representation Keeps one arm's fixed endpoint/contact data beside the existing joint-space rest representation; site order matches the problem times.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The context, seed and model read these fields; no per-query answer or solver history is part of an arm request.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing sites express no hold constraint and absent back reuses rest; no synthetic rig, repaired range or alternate branch is encoded.
   */
  export interface IArm {
    /** The arm. */
    side: "left" | "right";
    /** The arm at the first waypoint, and at the last unless `back` is given. */
    rest: HumanArmClearance.IArm;
    /** The arm at the last waypoint, where it returns to another arm than it left (a gesture that leaves from the entry and returns to the rest); `rest` when absent. */
    back?: HumanArmClearance.IArm;
    /** Its site at each waypoint, on the hold. */
    sites: readonly (ISite | undefined)[];
    /** The arm the goal's own solution gives at the hold's start, where its inverse kinematics starts first (`HumanArmSeed`). */
    guess?: HumanArmClearance.IArm;
    /** Its segments' declared rests over the hold (M.IRest). */
    rests?: readonly M.IRest[];
    /** Its segments that grasp one object with the other arm over the action (`M.IContext.grasped`). */
    grasp?: readonly M.Segment[];
  }

  /**
   * One unchanged body and one or two arms on ordered waypoint times.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the shared body, ordered seconds, corresponding bases and arm sites, and the action-progress callback.
   * @evidence contracts/development/design.md#principled-representation Time-aligned bases/sites and joint variables let the model judge the same composed body and paired contacts at each waypoint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ArmPlanned builds these inputs for solve, context, model and seed; the returned trajectory contains neither this problem nor its producer callback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Matching arrays, stable dependencies and the original model's admissibility are caller/solver premises; this record does not certify reach, clearance or a global optimum.
   */
  export interface IProblem {
    /** The body. */
    body: IHumanBody;
    /** The waypoints' seconds, in time order. */
    times: readonly number[];
    /** What every arm is read against at each waypoint, the arms of the problem left out. */
    bases: readonly G.IBase[];
    /** The arms, one or two. */
    arms: readonly IArm[];
    /**
     * The share of the reach made at a second of the reach, and of the return left at a second of the return: 0 at rest, 1 on the hold.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Names action seconds, the rest/hold endpoints and the caller-provided progress curve that HumanArmSeed reads for its reach/return paths and waypoint seed coordinates.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable field declares the timing input; the caller's clock owns its actual curve and HumanArmSeed owns its use in seed construction.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature has no body; the problem passes this timing callback to HumanArmSeed instead of defining another clock.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The declaration executes no interpolation or repair; the supplied callback must retain the action's timing semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature does no work; callback cost belongs to the provided clock and the actual path/waypoint queries made by HumanArmSeed.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature coordinates no evaluation; HumanArmSeed reads the supplied progress at its existing call sites, and playback uses solved coordinates instead.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires nothing; the problem and seed builder borrow the callback during solve, and the playback factory receives no callback.
     */
    share: (seconds: number) => number;
  }

  /**
   * An arm at any second of the solved span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Declares action seconds and the existing clinical arm result returned by setup conversion of interpolated coordinates.
   * @evidence contracts/development/design.md#principled-representation A time reader preserves random-order playback through the same Hermite trajectory instead of storing displayed poses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ArmCarry stores this callback and reads its arm; no optimiser/context getter is exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias adds no endpoint clamping, interpolation policy or validation; the solve-produced reader retains the existing numerical owners.
   */
  export type Trajectory = (seconds: number) => HumanArmClearance.IArm;

  /**
   * A laid course as `admitted` read it, and what that reading built, which
   * a following `solve` of the same problem reads instead of building it
   * again.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, when the course is kept and what the reading's context is for.
   * @evidence contracts/development/design.md#principled-representation The course's readers, its verdict with the refusing term, and the frame grid's context the verdict was read on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ArmPlanned reads the verdict and the readers, ArmCourse the refusing term, and `solve` the reading.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The context is the model's own record, handed on whole; no part of it is restated.
   */
  export interface IAdmitted {
    /** Each arm's trajectory through the course, in the problem's order. */
    trajectories: Trajectory[];

    /** Whether the model admits the course. */
    admitted: boolean;

    /** The model term that refuses the course (`M.IEvaluation.worst.term`); empty when admitted. */
    refused: string;

    /** The reading: the context builder bound to the problem's body and arms (`HumanArmTrajectoryContext.prepare`) and the context of the course's waypoints, in the mirror image `solve` reads the problem in. */
    read: {
      /** The context builder. */
      of: ReturnType<typeof HumanArmTrajectoryContext.prepare>;

      /** The context at the course's waypoints, the frame grid of the span. */
      context: M.IContext;
    };
  }

  /**
   * Solve the problem on its knots and admit it on the frame grid.
   *
   * The knots are first split where their sites' interpolant leaves the
   * act's own site (`HumanArmRefine.unbounded`), which needs no solve. The
   * trajectory is then optimised on the knots, its interpolant read on the
   * frame grid (`HumanArmTrajectoryAdmission.read`), and every interval the
   * reading fails in, and those about a knot the solve itself could not
   * meet its constraints at, split and the trajectory solved again from
   * itself at the penalty it reached, until the reading admits it or no
   * failing interval is two frames long: the check-and-refine loop of a
   * continuous collision check, on every term of the model.
   *
   * @param read The problem on given waypoints' seconds.
   * @param times The first knots' seconds, ascending.
   * @param course A laid course the model refused (`admitted`), read at the knots as the seed, its reading's context the frame grid; the sampling planner's seed (`HumanArmSeed`) on a grid of thirtieths of a second when absent, and after the course when it leads to no admitted trajectory.
   * @returns Each arm's trajectory, in the problem's order.
   * @throws {HumanRefusal} When no trajectory meets the constraints at its knots and on the frame grid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the seeds, the three refinements, the admission, ordered action seconds, the mirror solve and the refusal; playback borrows the final setup/time/coordinate data through a separate factory.
   * @evidence contracts/development/implementation.md#principled-implementation TrajOpt's few knots with a continuous reading between them (Schulman et al. 2013, sections V and VI), the reading here the model's own evaluation of the played interpolant on the frame grid, so nothing the film samples rests on the knots alone; a second initialisation only when the first ends unadmitted (their multiple initialisations).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The site refinement, one optimisation, then the admit-split-continue loop; a module-private factory creates each returned reader outside the builder's lexical environment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A trajectory is returned only when both its knots' evaluation and its frame-grid reading are within the model's tolerance; no bound is scaled to stand in for the reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms The optimiser's variables are the knots', a few per transport, instead of the frame grid's; each pass adds one evaluation over the grid. A hold's configuration found by the precheck is the planner seed's own, not solved twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A course's reading lends its context builder and its grid context, the same body, arms, bases and sites by identity, so the grid's frames and waypoint records are built once for the course and the solve; continued contexts keep the waypoint records of the knots they share; a refined solve continues from the last solution and its penalty.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned readers retain only the setup list, final times, coordinate arrays and their arm index; the problem/read callbacks, contexts and readings are released on return or throw.
   */
  export function solve(
    read: (times: readonly number[]) => IProblem,
    times: readonly number[],
    course?: IAdmitted,
  ): Trajectory[] {
    const first: IProblem = read(times);
    const flip: boolean = Mirror.leftFirst(first);
    const reading: (times: readonly number[]) => IProblem = flip
      ? (t: readonly number[]): IProblem => Mirror.mirrored(read(t))
      : read;
    let problem: IProblem = flip ? Mirror.mirrored(first) : first;
    const contextOf: ReturnType<typeof HumanArmTrajectoryContext.prepare> =
      course?.read.of ??
      HumanArmTrajectoryContext.prepare(
        problem.body,
        problem.arms.map((arm: IArm): "left" | "right" => arm.side),
      );
    let context: M.IContext = contextOf(problem, course?.read.context);

    // The frame grid over the span, the instants the played trajectory is
    // admitted at: the course's own where one was read.
    const fine: M.IContext = course?.read.context ?? gridded();
    function gridded(): M.IContext {
      const start: number = times[0]!;
      const end: number = times[times.length - 1]!;
      const grid: number[] = [start];
      for (let j: number = 1; start + j * STEP < end - 1e-9; ++j)
        grid.push(start + j * STEP);
      grid.push(end);
      return contextOf(reading(grid), context);
    }

    // The arms carried by their own interpolant onto knots with the given
    // intervals split; the knots kept keep what the last context built.
    const refine = (x: number[][][], split: readonly number[]): number[][][] => {
      const next: number[] = HumanArmRefine.split(context.times, split);
      const carried: number[][][] = x.map((arm: number[][]): number[][] =>
        next.map((t: number): number[] =>
          HumanArmRefine.hermite(context.times, arm, t),
        ),
      );
      problem = reading(next);
      context = contextOf(problem, context);
      return carried;
    };
    type Solved = {
      x: number[][][];
      evaluation: M.IEvaluation;
      penalty: number;
      played: Admission.IReading;
    };
    const optimised: (from: number[][][]) => Solved = (
      from: number[][][],
    ): Solved => {
      let seed: number[][][] = from;
      for (
        let split: number[] = HumanArmRefine.unbounded(context, fine);
        split.length > 0;
        split = HumanArmRefine.unbounded(context, fine)
      )
        seed = refine(seed, split);
      let solved: ReturnType<typeof HumanArmOptimiser.optimise> =
        HumanArmOptimiser.optimise(context, seed);
      let played: Admission.IReading = Admission.read(context, fine, solved.x);
      for (;;) {
        const split: Set<number> = new Set(
          Admission.unbounded(context, fine, played, STEP),
        );
        if (solved.evaluation.worst.value > M.TOLERANCE)
          for (const k of [
            solved.evaluation.worst.at - 1,
            solved.evaluation.worst.at,
          ])
            if (
              k >= 0 &&
              k + 1 < context.n &&
              context.times[k + 1]! - context.times[k]! >= 2 * STEP - 1e-9
            )
              split.add(k);
        if (split.size === 0) break;
        const carried: number[][][] = refine(
          solved.x,
          [...split].sort((p: number, q: number): number => p - q),
        );
        solved = HumanArmOptimiser.optimise(context, carried, solved.penalty);
        played = Admission.read(context, fine, solved.x);
      }
      return { ...solved, played };
    };
    const met = (solved: Solved): boolean =>
      solved.evaluation.worst.value <= M.TOLERANCE &&
      solved.played.evaluation.worst.value <= M.TOLERANCE;

    // A laid course seeds the optimiser in place of the sampling planner;
    // a course that leads it to no admitted trajectory is followed by the
    // planner's seed on the first knots, TrajOpt's multiple
    // initialisations (Schulman et al. 2013, section VI).
    const initial: IProblem = problem;
    const laid: number[][][] | undefined =
      course === undefined ? undefined : coursed(context, course.trajectories);

    // A hold no configuration meets has no trajectory: it is refused by its
    // own still problem before the whole trajectory's penalties are spent
    // on it (`HumanArmSeed.held`), and the configuration found is the
    // planner seed's hold where that seed follows.
    const hold: number[][] | undefined =
      laid === undefined ? undefined : HumanArmSeed.held(problem, context, laid);
    let solved: Solved = optimised(laid ?? HumanArmSeed.seed(problem, context));
    if (course !== undefined && !met(solved)) {
      problem = initial;
      context = contextOf(problem, fine);
      solved = optimised(HumanArmSeed.seed(problem, context, hold));
    }
    const n: number = context.n;
    const at: readonly number[] = context.times;
    if (!met(solved)) {
      const worst: M.IEvaluation["worst"] =
        solved.evaluation.worst.value > M.TOLERANCE
          ? solved.evaluation.worst
          : solved.played.evaluation.worst;
      throw new HumanRefusal({
        kind: "reach",
        axis: worst.axis,
        value: worst.axis === "duration" ? at[n - 1]! - at[0]! : worst.value,
        // A path too fast for the speed bound is met by the same path over a
        // longer span: scaling time by a factor divides every speed by it
        // (Hollerbach 1984, "Dynamic scaling of manipulator trajectories"),
        // so the span it needs is its own times the fastest probe's speed over
        // the bound, read at the knots and on the frame grid.
        feasible:
          worst.axis === "duration"
            ? {
                kind: "range",
                minimum:
                  (at[n - 1]! - at[0]!) *
                  Math.max(
                    slower(context, solved.x),
                    slower(fine, solved.played.x),
                  ),
                maximum: null,
                unit: "s",
              }
            : null,
        reason: `no path of the ${problem.arms.map((a: IArm): string => a.side).join(" and ")} arm over the action keeps the hand on its site, the arm clear and its speed within the audit's ${M.SPEED_LIMIT} m/s: ${worst.what}`,
        fix:
          worst.axis === "duration"
            ? "give the action more time"
            : "put the hand on a site its arm reaches with the body clear",
      });
    }
    const setups: G.ISetup[] = context.setups;
    return problem.arms.map(
      (_: IArm, a: number): Trajectory => trajectory(setups, at, solved.x, a),
    );
  }

  /**
   * A course laid without optimisation, admitted when it meets what a solved
   * trajectory must meet. The caller gives each arm on the hold, where its
   * goal's fit puts it; the reach and the return are laid here, in the
   * model's own coordinates (`G.encode`: the upper arm on its swing-twist
   * chart, so no clinical alias turns a continuous arm into a jump): every
   * arm of the group blended on one share from its rest to its arm at the
   * hold's first waypoint, and from the hold's last to its return. The
   * share is timed along the arc of the fastest bounded probe
   * (`T.SPEED`: elbow, wrist, fingertips) of any arm, by a trapezoid of
   * speed whose plateau is `PACE` of the audit's bound and whose two ramps
   * take the share of the span the arc leaves, `1 - L / (v T)`, no more than
   * half (the triangle): the smoothest profile of that family the span
   * allows under the bound (the time-scaling of a fixed path, Hollerbach
   * 1984). A span too short for the arc at the plateau is laid at constant
   * speed and refused on `speed` by the reading below.
   *
   * The course is read by the model's own evaluation (`M.evaluate`: every
   * site, range, clearance, crossing and speed bound) at the problem's own
   * waypoints, its first and its returned last waypoint the problem's rest
   * and back, and admitted only when its worst violation is within
   * `M.TOLERANCE`, the test `solve` refuses by. The caller gives waypoints
   * no more than a frame apart, so the course is read on the frame grid a
   * solved trajectory is admitted on.
   *
   * @param problem The problem on the course's waypoints.
   * @param held Each arm's clinical triples at each waypoint of the hold, in the problem's order; a waypoint of the reach or the return is not read.
   * @returns The course's readers, its admission with the refusing term, and its reading; a course not admitted is `solve`'s seed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the caller gives, how the transports are laid and timed, what is read, the fixed ends, the admission and its equivalence to `solve`'s refusal test.
   * @evidence contracts/development/implementation.md#principled-implementation A joint-space blend in the optimiser's own coordinates, time-scaled along the fastest probe's arc under the speed bound, read by the same context, hard-range projection and evaluation the optimiser's iterates are read by, in the same mirror image `solve` reads a left-first problem in, so an admitted course meets every requirement a solved one meets and a mirrored course is admitted alike.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One context, the hold's encoding, two transports, one evaluation, then the shared playback factory.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bound is relaxed; a course that misses one is returned to the caller's optimisation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One context build, `ARC` placements of each arm per transport for the arc, and one evaluation over N waypoints, the work of a single optimiser iterate, with no limb fit, convexification or quadratic programme.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the context builder, the model's placement and evaluation and `solve`'s playback, so both paths are read alike; the builder and the context are returned for `solve` to read the same grid on.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The arc's samples live until return; the readers keep only setups, times and coordinates, as `solve`'s do, and the reading's context lives while the caller holds the result.
   */
  export function admitted(
    problem: IProblem,
    held: readonly (readonly (HumanArmClearance.IArm | undefined)[])[],
  ): IAdmitted {
    // Read in the mirror image when the first arm is the left, as `solve`
    // reads it, so a course and its mirror are admitted alike to the bit;
    // clinical triples read the same on either side.
    const read: IProblem = Mirror.leftFirst(problem)
      ? Mirror.mirrored(problem)
      : problem;
    const of: ReturnType<typeof HumanArmTrajectoryContext.prepare> =
      HumanArmTrajectoryContext.prepare(
        read.body,
        read.arms.map((arm: IArm): "left" | "right" => arm.side),
      );
    const context: M.IContext = of(read);
    const n: number = context.n;
    const times: readonly number[] = context.times;
    const hold: number[] = [];
    for (let k: number = 0; k < n; ++k)
      if (held.every((arm: readonly (HumanArmClearance.IArm | undefined)[]): boolean => arm[k] !== undefined))
        hold.push(k);
    const first: number = hold.length === 0 ? n - 1 : hold[0]!;
    const last: number = hold.length === 0 ? n - 1 : hold[hold.length - 1]!;
    const x: number[][][] = held.map(
      (course: readonly (HumanArmClearance.IArm | undefined)[], a: number): number[][] =>
        course.map((arm: HumanArmClearance.IArm | undefined, k: number): number[] =>
          k === 0
            ? [...context.rest[a]!]
            : k === n - 1 && !context.open
              ? [...context.back[a]!]
              : arm === undefined || k < first || k > last
                ? []
                : M.ranged(context, a, G.encode(context.setups[a]!, arm)),
        ),
    );
    const mix = (p: readonly number[], q: readonly number[], w: number): number[] =>
      p.map((v: number, d: number): number => v + (q[d]! - v) * w);

    // One transport between two waypoints already laid: the arcs are read
    // on the base of its first waypoint, the arms' own travel.
    const lay = (from: number, to: number): void => {
      if (to - from < 2) return;
      const ends: [readonly number[], readonly number[]][] = x.map(
        (arm: number[][]): [readonly number[], readonly number[]] => [arm[from]!, arm[to]!],
      );
      const placed = (share: number): G.IPlaced[] =>
        ends.map(([p, q]: [readonly number[], readonly number[]], a: number): G.IPlaced =>
          G.placed(context.setups[a]!, context.frames[a]![from]!, mix(p, q, share)));
      const along: number[] = [0];
      let before: G.IPlaced[] = placed(0);
      for (let s: number = 1; s <= ARC; ++s) {
        const now: G.IPlaced[] = placed(s / ARC);
        let step: number = 0;
        now.forEach((arm: G.IPlaced, a: number): void => {
          for (const p of T.SPEED)
            step = Math.max(step, Vector3.length(
              Vector3.subtract(arm.probes[p]![0], before[a]!.probes[p]![0])));
        });
        along.push(along[s - 1]! + step);
        before = now;
      }
      const arc: number = along[ARC]!;
      const seconds: number = times[to]! - times[from]!;
      const ramp: number = Math.max(0, Math.min(0.5, 1 - arc / (PACE * M.SPEED_LIMIT * seconds)));
      const run = (w: number): number =>
        ramp < 1e-9
          ? w
          : w < ramp
            ? (w * w) / (2 * ramp * (1 - ramp))
            : w > 1 - ramp
              ? 1 - ((1 - w) * (1 - w)) / (2 * ramp * (1 - ramp))
              : (w - ramp / 2) / (1 - ramp);
      for (let k: number = from + 1; k < to; ++k) {
        const reached: number = arc * run((times[k]! - times[from]!) / seconds);
        let s: number = 1;
        while (s < ARC && along[s]! < reached) ++s;
        const span: number = along[s]! - along[s - 1]!;
        const share: number = (s - 1 + (span > 1e-12 ? (reached - along[s - 1]!) / span : 0)) / ARC;
        x.forEach((arm: number[][], a: number): void => {
          arm[k] = M.ranged(context, a, mix(ends[a]![0], ends[a]![1], share));
        });
      }
    };
    lay(0, first);
    lay(last, n - 1);
    const worst: M.IEvaluation["worst"] = M.evaluate(context, x).worst;
    return {
      trajectories: problem.arms.map(
        (_: IArm, a: number): Trajectory =>
          trajectory(context.setups, context.times, x, a),
      ),
      admitted: worst.value <= M.TOLERANCE,
      refused: worst.value <= M.TOLERANCE ? "" : worst.term,
      read: { of, context },
    };
  }

  /**
   * The factor a trajectory's span must grow by for every speed-bounded
   * probe to move within the audit's bound: the largest ratio, over each
   * interval and probe, of the probe's speed to the bound.
   */
  function slower(c: M.IContext, x: readonly (readonly number[])[][]): number {
    let most: number = 1;
    x.forEach((arm: readonly (readonly number[])[], a: number): void => {
      for (let k: number = 0; k + 1 < c.n; ++k) {
        const now: G.IPlaced = G.placed(
          c.setups[a]!,
          c.frames[a]![k]!,
          arm[k]!,
        );
        const next: G.IPlaced = G.placed(
          c.setups[a]!,
          c.frames[a]![k + 1]!,
          arm[k + 1]!,
        );
        const dt: number = c.times[k + 1]! - c.times[k]!;

        // The arm's own travel, against its base (`HumanArmTrajectoryTravel`):
        // slowing the action slows nothing a carrier does.
        for (const p of T.SPEED) {
          const d: IAutoMovieVector3 = V.step(
            c.frames[a]![k]!,
            c.frames[a]![k + 1]!,
            now.probes[p]![0],
            next.probes[p]![0],
          );
          most = Math.max(most, Vector3.length(d) / (M.SPEED_LIMIT * dt));
        }
      }
    });
    return most;
  }
}

/** A course's arms at a context's waypoints as coordinates, its first and returned last waypoint the context's rest and back. */
function coursed(
  c: M.IContext,
  course: readonly HumanArmTrajectory.Trajectory[],
): number[][][] {
  return course.map((reader: HumanArmTrajectory.Trajectory, a: number): number[][] =>
    c.times.map((t: number, k: number): number[] =>
      k === 0
        ? [...c.rest[a]!]
        : k === c.n - 1 && !c.open
          ? [...c.back[a]!]
          : M.ranged(c, a, G.encode(c.setups[a]!, reader(t))),
    ),
  );
}

/** Own only the original playback inputs, without the solve builder's problem/read/context environment. */
function trajectory(
  setups: readonly G.ISetup[],
  times: readonly number[],
  coordinates: readonly (readonly (readonly number[])[])[],
  arm: number,
): HumanArmTrajectory.Trajectory {
  return (seconds: number): HumanArmClearance.IArm =>
    G.arm(setups[arm]!, HumanArmRefine.hermite(times, coordinates[arm]!, seconds));
}

/** The frame grid, seconds: the instants a played trajectory is admitted at where no course gives its own, and the least two knots are spaced. */
const STEP: number = 1 / 30;

/** The share of the audit's bound a laid transport's plateau runs at: the margin its sampled arc and its waypoints' chords leave (provisional). */
const PACE: number = 0.97;

/** The samples a laid transport's arc is read on (provisional: under a degree of any joint's travel apiece on a daily reach). */
const ARC: number = 48;

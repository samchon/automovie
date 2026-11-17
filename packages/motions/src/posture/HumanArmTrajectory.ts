import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/**
 * A performer's arms over one action as one trajectory optimisation, in
 * TrajOpt's formulation (Schulman et al. 2014, "Motion planning with
 * sequential convex optimization and convex collision checking", IJRR
 * 33:1251): the arms' joint-space waypoints over the reach, the hold and the
 * return are the variables, the objective and the constraints are
 * `HumanArmTrajectoryModel`'s, and the problem is solved by penalty
 * sequential convex optimisation with a trust region (TrajOpt's Algorithm
 * 1, `HumanArmOptimiser`) from a seed whose hold is solved by inverse
 * kinematics and whose reach and return are a sampling planner's clear paths
 * (`HumanArmSeed`), its waypoints refined where they do not bound what lies
 * between them (`HumanArmRefine`). Two arms that move over one span are one problem, their probes kept
 * clear of each other as they both move: planning one after the other is
 * incomplete where their paths are coupled (Erdmann and Lozano-Pérez 1987,
 * Algorithmica 2:477). A problem whose first arm is the left is solved as its mirror image, the arms on the other side, so mirrored scenes give mirrored paths. A
 * problem still infeasible at the last penalty is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the joint-space trajectory, penalty solve, seed/refinement, paired-arm constraints, mirror convention and refusal; solve documents the returned reader's narrower lifetime.
 * @evidence contracts/development/design.md#principled-representation One problem owns the fixed rig, sampled bases/sites and joint-space variables during optimisation; playback needs only the existing setup list, final times and solved coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The site alias, arm/problem inputs, trajectory callback and solve serve ArmPlanned; the module-private playback factory exposes no optimiser or cache API.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains the existing constraints, mirror rules, actual optimisation and refinement grid; no sample, tolerance, pose history or alternative solver is substituted.
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
   * Solve the problem, its waypoints refined where they do not bound what
   * lies between them (`HumanArmRefine`): first on the seed, then on each
   * solution, which is solved again from itself on the refined waypoints
   * until every interval bounds its site's path and its probes' clearance
   * or is down to the frame grid, the check-and-refine loop of a continuous
   * collision check. A solution that does not meet its constraints is also
   * refined about the waypoint it fails at, the discretisation being what a
   * continuous constraint (a sweep, a speed) is met on, and solved again.
   *
   * @param read The problem on given waypoints' seconds.
   * @param times The first waypoints' seconds, ascending.
   * @param course A laid course the model refused (`admitted`), each arm's in the problem's order, read at the first waypoints as the seed; the sampling planner's seed (`HumanArmSeed`) when absent, and after it when the course leads to no feasible path.
   * @returns Each arm's trajectory, in the problem's order.
   * @throws {HumanRefusal} When no trajectory meets the constraints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the seeds, seed/solution refinement, ordered action seconds, original paired-arm/mirror solve and refusal; playback borrows the final setup/time/coordinate data through a separate factory.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the laid course or the existing seed, penalty optimiser and continuous-check refinement, a second initialisation only when the first ends infeasible (Schulman et al. 2014 restart TrajOpt from several initialisations), then reads the selected coordinates through the same Hermite interpolation and arm conversion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Planning stays in this builder; a module-private factory creates each returned reader from the original setup list, final times, solved coordinates and arm index, outside the builder's lexical environment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every grid instant, split, optimiser call, acceptance/refusal and playback expression; no cloning, freezing, weakened constraint or sampled pose shortcut changes input ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Builds the original duration-scaled fine grid and waypoint contexts, retaining all actual optimisation/refinement work and its peak populations. Playback still performs one Hermite query and one arm conversion; the factory adds one fixed-size call per arm, with no measured time or heap-byte claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One genuine fixed body/ordered-side setup builder serves original, fine and refined contexts; every current frame/site remains actual and continued contexts reuse only matching waypoint records. Playback borrows the same setup/time/coordinate references and keeps its original late arm-index lookups; each requested second still computes its actual arm.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned readers explicitly retain only the setup list, final times, coordinate arrays and their arm index; setups still borrow the body and rig metadata. The problem/read/refinement callbacks, fine context and time/goal/waypoint maps are not passed to the playback factory. This is an explicit ownership boundary, not a measured heap reduction or a bound on the optimiser's peak populations.
   */
  export function solve(
    read: (times: readonly number[]) => IProblem,
    times: readonly number[],
    course?: readonly Trajectory[],
  ): Trajectory[] {
    const first: IProblem = read(times);
    const reading: (times: readonly number[]) => IProblem = leftFirst(first)
      ? (t: readonly number[]): IProblem => mirrored(read(t))
      : read;
    let problem: IProblem = leftFirst(first) ? mirrored(first) : first;
    const contextOf: ReturnType<typeof HumanArmTrajectoryContext.prepare> =
      HumanArmTrajectoryContext.prepare(problem.body,
        problem.arms.map((arm: IProblem["arms"][number]): "left" | "right" => arm.side));
    let context: M.IContext = contextOf(problem);
    // The frame grid over the span, the instants between waypoints are read at.
    const start: number = times[0]!;
    const end: number = times[times.length - 1]!;
    const grid: number[] = [start];
    for (let j: number = 1; start + j * STEP < end - 1e-9; ++j)
      grid.push(start + j * STEP);
    grid.push(end);
    const fine: M.IContext = contextOf(
      reading(grid),
      context,
    );
    // Split where the waypoints do not bound what lies between them, and
    // about a waypoint the solve could not meet its constraints at, the arms
    // carried onto the new waypoints by their own interpolant.
    const refined = (
      x: number[][][],
      failed?: M.IEvaluation,
    ): number[][][] | undefined => {
      const split: number[] = HumanArmRefine.unbounded(context, fine, x);
      if (failed !== undefined && failed.worst.value > M.TOLERANCE)
        for (const k of [failed.worst.at - 1, failed.worst.at])
          if (
            k >= 0 &&
            k + 1 < context.n &&
            context.times[k + 1]! - context.times[k]! >= 2 * STEP - 1e-9 &&
            !split.includes(k)
          )
            split.push(k);
      split.sort((p: number, q: number): number => p - q);
      if (split.length === 0) return undefined;
      const next: number[] = HumanArmRefine.split(context.times, split);
      const carried: number[][][] = x.map((arm: number[][]): number[][] =>
        next.map((t: number): number[] =>
          HumanArmRefine.hermite(context.times, arm, t),
        ),
      );
      problem = reading(next);

      // The waypoints kept from the last reading keep what its context
      // built on them; only the new ones are read.
      context = contextOf(problem, context);
      return carried;
    };
    type Solved = { x: number[][][]; evaluation: M.IEvaluation; penalty: number };
    const optimised: (from: number[][][]) => Solved = (
      from: number[][][],
    ): Solved => {
      let seed: number[][][] = from;
      for (
        let again: number[][][] | undefined = refined(seed);
        again !== undefined;
        again = refined(seed)
      )
        seed = again;
      let solved: Solved = HumanArmOptimiser.optimise(context, seed);
      for (
        let again: number[][][] | undefined = refined(
          solved.x,
          solved.evaluation,
        );
        again !== undefined;
        again = refined(solved.x, solved.evaluation)
      )
        solved = HumanArmOptimiser.optimise(context, again, solved.penalty);
      return solved;
    };

    // A laid course seeds the optimiser in place of the sampling planner;
    // a course that leads it to no feasible path is followed by the
    // planner's seed on the first waypoints, TrajOpt's multiple
    // initialisations (Schulman et al. 2014).
    const initial: IProblem = problem;
    let solved: Solved = optimised(
      course === undefined
        ? HumanArmSeed.seed(problem, context)
        : coursed(context, course),
    );
    if (course !== undefined && solved.evaluation.worst.value > M.TOLERANCE) {
      problem = initial;
      context = contextOf(problem);
      solved = optimised(HumanArmSeed.seed(problem, context));
    }
    const {
      x,
      evaluation: current,
    }: { x: number[][][]; evaluation: M.IEvaluation; penalty: number } = solved;
    const n: number = context.n;
    const at: readonly number[] = context.times;
    if (current.worst.value > M.TOLERANCE)
      throw new HumanRefusal({
        kind: "reach",
        axis: current.worst.axis,
        value:
          current.worst.axis === "duration"
            ? at[n - 1]! - at[0]!
            : current.worst.value,
        // A path too fast for the speed bound is met by the same path over a
        // longer span: scaling time by a factor divides every speed by it
        // (Hollerbach 1984, "Dynamic scaling of manipulator trajectories"),
        // so the span it needs is its own times the fastest probe's speed over
        // the bound.
        feasible:
          current.worst.axis === "duration"
            ? {
                kind: "range",
                minimum: (at[n - 1]! - at[0]!) * slower(context, x),
                maximum: null,
                unit: "s",
              }
            : null,
        reason: `no path of the ${problem.arms.map((a: IArm): string => a.side).join(" and ")} arm over the action keeps the hand on its site, the arm clear and its speed within the audit's ${M.SPEED_LIMIT} m/s: ${current.worst.what}`,
        fix:
          current.worst.axis === "duration"
            ? "give the action more time"
            : "put the hand on a site its arm reaches with the body clear",
      });
    const setups: G.ISetup[] = context.setups;
    return problem.arms.map(
      (_: IArm, a: number): Trajectory => trajectory(setups, at, x, a),
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
   * `M.TOLERANCE`, the test `solve` refuses by. Waypoints a frame apart are
   * the finest `solve` refines to (`HumanArmRefine`), so a course on the
   * frame grid is read where a solved trajectory would be.
   *
   * @param problem The problem on the course's waypoints.
   * @param held Each arm's clinical triples at each waypoint of the hold, in the problem's order; a waypoint of the reach or the return is not read.
   * @returns Each arm's trajectory through the course, read as `solve`'s are, whether it is admitted, and the model term that refuses it (`M.IEvaluation.worst.term`; empty when admitted); a course not admitted is `solve`'s seed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the caller gives, how the transports are laid and timed, what is read, the fixed ends, the admission and its equivalence to `solve`'s refusal test.
   * @evidence contracts/development/implementation.md#principled-implementation A joint-space blend in the optimiser's own coordinates, time-scaled along the fastest probe's arc under the speed bound, read by the same context, hard-range projection and evaluation the optimiser's iterates are read by, in the same mirror image `solve` reads a left-first problem in, so an admitted course meets every requirement a solved one meets and a mirrored course is admitted alike.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One context, the hold's encoding, two transports, one evaluation, then the shared playback factory.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bound is relaxed; a course that misses one is returned to the caller's optimisation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One context build, `ARC` placements of each arm per transport for the arc, and one evaluation over N waypoints, the work of a single optimiser iterate, with no limb fit, convexification or quadratic programme.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the context builder, the model's placement and evaluation and `solve`'s playback, so both paths are read alike.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The context and the arc's samples live until return; the readers keep only setups, times and coordinates, as `solve`'s do.
   */
  export function admitted(
    problem: IProblem,
    held: readonly (readonly (HumanArmClearance.IArm | undefined)[])[],
  ): { trajectories: Trajectory[]; admitted: boolean; refused: string } {
    // Read in the mirror image when the first arm is the left, as `solve`
    // reads it, so a course and its mirror are admitted alike to the bit;
    // clinical triples read the same on either side.
    const read: IProblem = leftFirst(problem) ? mirrored(problem) : problem;
    const context: M.IContext = HumanArmTrajectoryContext.prepare(
      read.body,
      read.arms.map((arm: IArm): "left" | "right" => arm.side),
    )(read);
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

  /**
   * Whether the problem is solved in the mirror image of its world: when its
   * first arm is the left. The mirror takes every arm to the other side in
   * order, so of a problem and its mirror image exactly one begins with the
   * right arm, and that one is solved; the other is its mirror. A left arm
   * alone and a pair listed left first are solved as their mirrors, so
   * mirrored scenes give mirrored paths to the bit.
   */
  function leftFirst(problem: IProblem): boolean {
    return problem.arms[0]!.side === "left";
  }

  /** A problem in the mirror image of its world: every arm on the other side, its sites, rests and bases mirrored. */
  function mirrored(problem: IProblem): IProblem {
    return {
      ...problem,
      bases: problem.bases.map(mirroredBase),
      arms: problem.arms.map(
        (arm: IArm): IArm => ({
          ...arm,
          side: arm.side === "left" ? "right" : "left",
          sites: arm.sites.map((s: ISite | undefined): ISite | undefined =>
            s === undefined ? undefined : mirroredSite(s),
          ),
          ...(arm.rests === undefined
            ? {}
            : {
                rests: arm.rests.map(
                  (r: M.IRest): M.IRest => ({
                    ...r,
                    on: HumanArmMirror.opposite(r.on as AutoMovieHumanoidBone),
                  }),
                ),
              }),
        }),
      ),
    };
  }
  /** A base's mirror image (`HumanArmMirror.mirrored`), one record per base, so the frames built on it are built once. */
  function mirroredBase(base: G.IBase): G.IBase {
    let found: G.IBase | undefined = MIRRORED.get(base);
    if (found === undefined)
      MIRRORED.set(base, (found = HumanArmMirror.mirrored(base)));
    return found;
  }

  /** A site's mirror image across the world's x = 0 plane, one record per site, as `mirroredBase`. */
  function mirroredSite(site: ISite): ISite {
    let found: ISite | undefined = SITES.get(site);
    if (found === undefined) SITES.set(site, (found = flipped(site)));
    return found;
  }

  /** A site's mirror image, built. */
  function flipped(site: ISite): ISite {
    return {
      ...site,
      point: HumanArmMirror.flip(site.point),
      contact: HumanArmMirror.flip(site.contact),
      ...(site.limits === undefined
        ? {}
        : {
            limits: site.limits.map(
              (
                limit: NonNullable<ISite["limits"]>[number],
              ): NonNullable<ISite["limits"]>[number] => ({
                ...limit,
                contact: HumanArmMirror.flip(limit.contact),
              }),
            ),
          }),
      ...(site.rotation === undefined
        ? {}
        : { rotation: HumanArmMirror.turn(site.rotation) }),
      // A site riding another arm's segment, in that segment's own frame.
      ...(site.on === undefined
        ? {}
        : {
            on: {
              ...site.on,
              point: HumanArmMirror.flip(site.on.point),
              ...(site.on.normal === undefined
                ? {}
                : { normal: HumanArmMirror.flip(site.on.normal) }),
              ...(site.on.rotation === undefined
                ? {}
                : { rotation: HumanArmMirror.turn(site.on.rotation) }),
            },
          }),
    };
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

/** The frame grid, seconds: the instants between waypoints are read at. */
const STEP: number = 1 / 30;

/** Each base's mirror image, kept while the base is held. */
const MIRRORED: WeakMap<G.IBase, G.IBase> = new WeakMap();

/** Each site's mirror image, kept while the site is held. */
const SITES: WeakMap<HumanArmTrajectory.ISite, HumanArmTrajectory.ISite> =
  new WeakMap();

/** The share of the audit's bound a laid transport's plateau runs at: the margin its sampled arc and its waypoints' chords leave (provisional). */
const PACE: number = 0.97;

/** The samples a laid transport's arc is read on (provisional: under a degree of any joint's travel apiece on a daily reach). */
const ARC: number = 48;

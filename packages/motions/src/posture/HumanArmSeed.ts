import type { IAutoMovieMotionHumanArmClearance } from "@automovie/interface";

import { HUMAN_ARM_COORDINATE_RATES as RATES } from "./HUMAN_ARM_COORDINATE_RATES";
import { HumanArmConnect } from "./HumanArmConnect";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmSeedHold } from "./HumanArmSeedHold";
import { HumanArmSeedSpace as Space } from "./HumanArmSeedSpace";
import { HumanArmSeedTransition } from "./HumanArmSeedTransition";
import type { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * Hold poses solved by inverse kinematics, plus the initial path connecting
 * them. MoveIt's CHOMP adapter seeds its optimiser with a sampling planner
 * (`OptimizerAdapter::adaptAndPlan`, moveit/moveit, BSD-3-Clause,
 * 811328b1ba700f5d2dff69afc9737ac6cab66c9b). RRT-Connect reads valid poses at
 * their own times as in EXOTica's `TimeIndexedSamplingProblem::Update`.
 */
export namespace HumanArmSeed {
  /** What the seed reads. */
  export interface IProblem extends HumanArmTrajectoryContext.IProblem {
    /** Each arm and its optional first inverse-kinematics seed. */
    arms: readonly (HumanArmTrajectoryContext.IProblem["arms"][number] & {
      /** The law's goal pose for the arm. */
      guess?: IAutoMovieMotionHumanArmClearance.IArm;
    })[];
  }

  /** Each hold waypoint's arm coordinates, indexed by its seconds. */
  export type IHolds = ReadonlyMap<number, number[][]>;

  /**
   * Solve at each hold knot where an arm has a site. Carry the preceding pose
   * into the next solve, and reuse exact poses at existing knots during
   * refinement.
   *
   * @param problem The problem.
   * @param context Its context.
   * @param from A proposed course's coordinates at these knots, by arm.
   * @param fixed Hold poses already solved on a subset of these knots.
   * @param fine The original frame grid for admissions to adjacent holds.
   * @returns The hold poses.
   * @throws {HumanRefusal} When a hold waypoint has no feasible pose.
   */
  export function holds(
    problem: IProblem,
    context: M.IContext,
    from?: readonly (readonly (readonly number[])[])[],
    fixed?: IHolds,
    fine?: M.IContext,
  ): IHolds {
    const out: Map<number, number[][]> = new Map(fixed);
    const frames: Map<number, number> = new Map(
      fine?.times.map((t: number, i: number): [number, number] => [t, i]),
    );
    let previous: number[][] | undefined;
    for (let k: number = 1; k < context.n; ++k) {
      if (
        !M.inner(context, k) ||
        !context.sites.some(
          (sites: readonly (M.ISite | undefined)[]): boolean =>
            sites[k] !== undefined,
        )
      ) {
        previous = undefined;
        continue;
      }
      const seconds: number = context.times[k]!;
      const proposed: readonly (readonly number[])[] | undefined = from?.map(
        (arm: readonly (readonly number[])[]): readonly number[] => arm[k]!,
      );
      const settled: number[][] | undefined = out.get(seconds);
      if (settled !== undefined) {
        previous = settled;
        continue;
      }
      const frame: number | undefined = frames.get(seconds);
      const next: number[][] | undefined = out.get(context.times[k + 1]!);
      const anchors: Parameters<typeof HumanArmSeedTransition>[2] =
        frame === undefined
          ? []
          : [
              ...(previous !== undefined &&
              frames.get(context.times[k - 1]!) === frame - 1
                ? [{ frame: frame - 1, pose: previous }]
                : []),
              ...(next !== undefined &&
              frames.get(context.times[k + 1]!) === frame + 1
                ? [{ frame: frame + 1, pose: next }]
                : []),
            ];
      previous = HumanArmSeedHold(
        problem,
        context,
        k,
        previous,
        proposed,
        fine === undefined || frame === undefined
          ? undefined
          : HumanArmSeedTransition(fine, frame, anchors),
      );
      out.set(seconds, previous);
    }
    return out;
  }

  /**
   * Build one seed through the fixed poses. Run the sampling planner once for
   * each reach, return or gap that contains free knots.
   *
   * @param context The context on the seed's knots.
   * @param pinned The hold poses.
   * @param fine The context on the finer frame grid.
   * @param laid The authored coordinates on these knots when a law supplies a
   *   course. They seed a gap when the sampling planner cannot connect it.
   * @returns Each arm's coordinates at every knot.
   */
  export function seed(
    context: M.IContext,
    pinned: IHolds,
    fine: M.IContext,
    laid?: readonly (readonly (readonly number[])[])[],
  ): number[][][] {
    const times: readonly number[] = context.times;
    const space: Space.ISpace = Space.sampler(context);
    const last: number = context.n - 1;
    const knots: number[][][] = [context.rest];
    let previous: number = 0;
    for (let k: number = 1; k <= last; ++k) {
      const held: number[][] | undefined = pinned.get(times[k]!);
      if (held === undefined && k !== last) continue;
      const destination: number[][] = held ?? context.back;
      if (k - previous > 1) {
        // Search a return backwards from its fixed rest, as an approach to
        // the last hold. Search the other intervals in playback order.
        const back: boolean = k === last && held === undefined && previous > 0;
        const begin: number = times[back ? k : previous]!;
        const end: number = times[back ? previous : k]!;
        const start: number[][] = knots[previous]!;
        const route: number[][] | null = back
          ? path(space, fine, destination, start, begin, end, true)
          : path(
              space,
              fine,
              start,
              destination,
              begin,
              end,
              held !== undefined,
            );
        for (let j: number = previous + 1; j < k; ++j) {
          if (route !== null) {
            const share: number = (times[j]! - begin) / (end - begin);
            knots[j] = Space.split(Space.at(route, share));
          } else if (laid !== undefined) {
            knots[j] = laid.map((arm, a) => M.ranged(context, a, arm[j]!));
          } else {
            const share: number =
              (times[j]! - times[previous]!) / (times[k]! - times[previous]!);
            knots[j] = start.map((arm, a) =>
              HumanArmConnect.lerp(arm, destination[a]!, share),
            );
          }
        }
      }
      knots[k] = destination;
      previous = k;
    }
    return context.rest.map((_: number[], a: number): number[][] =>
      knots.map((pose: number[][]): number[] => [...pose[a]!]),
    );
  }

  /**
   * Read the first shared hold's feasibility without solving its trajectory.
   *
   * @param problem The problem.
   * @param context Its context.
   * @param from A proposed course's coordinates at these knots, by arm.
   * @returns The solved pose, or undefined if there is no shared hold.
   * @throws {HumanRefusal} When the first shared hold has no feasible pose.
   */
  export function held(
    problem: IProblem,
    context: M.IContext,
    from: readonly (readonly (readonly number[])[])[],
  ): number[][] | undefined {
    for (let k: number = 1; k < context.n; ++k)
      if (
        M.inner(context, k) &&
        context.sites.every(
          (sites: readonly (M.ISite | undefined)[]): boolean =>
            sites[k] !== undefined,
        )
      )
        return HumanArmSeedHold(
          problem,
          context,
          k,
          undefined,
          from.map(
            (arm: readonly (readonly number[])[]): readonly number[] => arm[k]!,
          ),
        );
    return undefined;
  }
}

/**
 * Search in joint space and time. A state approaching a hold uses the
 * allowances at that frame, with task points enforced at the goal itself. Where
 * no path is found, the law's own initialisation is carried on to TrajOpt,
 * whose initialisation is straight only without a known course (Schulman et al.
 * 2014, IJRR 33:1251, section VIII-A).
 */
function path(
  space: Space.ISpace,
  scene: M.IContext,
  from: number[][],
  to: number[][],
  begin: number,
  end: number,
  hold: boolean,
): number[][] | null {
  const dims: number = from.length * G.DIMENSIONS;
  const start: number[] = [...from.flat(), 0];
  const goal: number[] = [...to.flat(), 1];
  return HumanArmConnect.connect({
    start,
    goal,
    low: space.low,
    high: space.high,
    discs: space.discs,
    valid: (q: readonly number[]): boolean =>
      M.invalid(
        scene,
        nearest(scene.times, begin + q[dims]! * (end - begin)),
        Space.split(q.slice(0, dims)),
        false,
        hold && q[dims]! >= 1,
      ).value <= M.TOLERANCE,
    seconds: Math.abs(end - begin),
    velocities: from.flatMap((): readonly number[] => RATES),
  });
}

/** Find the nearest frame to a sample on the ascending frame grid. */
function nearest(times: readonly number[], seconds: number): number {
  let low: number = 0;
  let high: number = times.length - 1;
  while (high - low > 1) {
    const middle: number = Math.floor((low + high) / 2);
    if (times[middle]! < seconds) low = middle;
    else high = middle;
  }
  return seconds - times[low]! <= times[high]! - seconds ? low : high;
}

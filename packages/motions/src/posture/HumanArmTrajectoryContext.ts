import { preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmFrame } from "./HumanArmFrame";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryAllowances } from "./HumanArmTrajectoryAllowances";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryWaypoint as W } from "./HumanArmTrajectoryWaypoint";

/** The record of `IProblemArmsItem`'s site. */
type IProblemArmsItem = {
  /** The arm. */
  side: AutoMovieHumanSide;

  /**
   * The arm at the first waypoint, and the arm the allowances are read from at
   * every waypoint but a fixed last one.
   */
  rest: IAutoMovieMotionHumanArmClearance.IArm;

  /**
   * The arm at the last waypoint, which the allowances there are read from when
   * the waypoint is fixed; `rest` when absent.
   */
  back?: IAutoMovieMotionHumanArmClearance.IArm;

  /** Its site at each waypoint, on the hold. */
  sites: readonly (M.ISite | undefined)[];

  /** Its segments' declared rests over the hold. */
  rests?: readonly M.IRest[];

  /**
   * Its segments that grasp one object with the other arm over the action
   * (`HumanArmTrajectoryModel.IContext.grasped`); none when absent.
   */
  grasp?: readonly M.Segment[];

  /**
   * The arm the goal's own solution gives at the hold's start, whose grasping
   * pairs' depth the closing and the parting keep
   * (`HumanArmTrajectoryModel.IContext.grasped`); none when absent.
   */
  guess?: IAutoMovieMotionHumanArmClearance.IArm;

  /**
   * The arm a still configuration is drawn to, its distance from it the
   * objective's (`HumanArmTrajectoryModel.IContext.anchor`); none when absent.
   */
  anchor?: IAutoMovieMotionHumanArmClearance.IArm;
};

/**
 * Share only explicitly fixed native setups; all current waypoint geometry
 * remains actual.
 */
function built(
  problem: HumanArmTrajectoryContext.IProblem,
  previous?: M.IContext,
  prepared?: IAutoMovieMotionHumanArmGeometry.ISetup[],
): M.IContext {
  const n: number = problem.times.length;
  const alone: boolean = problem.arms.length === 1;
  const setups: IAutoMovieMotionHumanArmGeometry.ISetup[] =
    prepared ??
    problem.arms.map(
      (
        arm: HumanArmTrajectoryContext.IProblem["arms"][number],
      ): IAutoMovieMotionHumanArmGeometry.ISetup =>
        G.prepare(problem.body, arm.side),
    );
  const rest: number[][] = problem.arms.map(
    (
      arm: HumanArmTrajectoryContext.IProblem["arms"][number],
      a: number,
    ): number[] => G.encode(setups[a]!, arm.rest),
  );
  const back: number[][] = problem.arms.map(
    (
      arm: HumanArmTrajectoryContext.IProblem["arms"][number],
      a: number,
    ): number[] => G.encode(setups[a]!, arm.back ?? arm.rest),
  );
  const free: number[][] = setups.map(
    (setup: IAutoMovieMotionHumanArmGeometry.ISetup): number[] => {
      const out: number[] = [];
      for (let d: number = 0; d < G.DIMENSIONS; ++d)
        if (setup.free[d]!) out.push(d);
      return out;
    },
  );
  const offset: number[] = [];
  let width: number = 0;
  for (const f of free) {
    offset.push(width);
    width += f.length;
  }
  const model: IAutoMovieMotionHumanAuditTangleModel.IModel =
    problem.body.tangle;

  // A hold that lasts to the end leaves the last waypoint to be solved;
  // a still configuration keeps both its ends.
  const open: boolean =
    problem.still !== true &&
    n > 1 &&
    problem.arms.every(
      (arm: HumanArmTrajectoryContext.IProblem["arms"][number]): boolean =>
        arm.sites[n - 1] !== undefined,
    );

  // Each waypoint's record. A fixed last waypoint holds the arm the action
  // leaves to, so the arm resting there is that one.
  const points: W.IWaypoint[] = problem.times.map(
    (_: number, k: number): W.IWaypoint => {
      const prepared: ReturnType<typeof preparePoseResolution> | undefined =
        setups.length > 1 ? preparePoseResolution() : undefined;
      // Each arm reads its own view of the base where it has one
      // (`IBase.arms`): its own rests, never the other hand's.
      const base: HumanArmTrajectoryContext.IProblem["bases"][number] =
        problem.bases[k]!;
      const frames: IAutoMovieMotionHumanArmGeometry.IFrame[] = setups.map(
        (
          setup: IAutoMovieMotionHumanArmGeometry.ISetup,
          a: number,
        ): IAutoMovieMotionHumanArmGeometry.IFrame =>
          HumanArmFrame(setup, base.arms?.[a] ?? base, alone, prepared),
      );
      const sites: (M.ISite | undefined)[] = problem.arms.map(
        (
          arm: HumanArmTrajectoryContext.IProblem["arms"][number],
        ): M.ISite | undefined => arm.sites[k],
      );
      return W(
        problem,
        setups,
        k === n - 1 && !open ? back : rest,
        frames,
        sites,
      );
    },
  );
  const frames: IAutoMovieMotionHumanArmGeometry.IFrame[][] = setups.map(
    (
      _: IAutoMovieMotionHumanArmGeometry.ISetup,
      a: number,
    ): IAutoMovieMotionHumanArmGeometry.IFrame[] =>
      points.map(
        (p: W.IWaypoint): IAutoMovieMotionHumanArmGeometry.IFrame =>
          p.frames[a]!,
      ),
  );
  const sites: (M.ISite | undefined)[][] = setups.map(
    (
      _: IAutoMovieMotionHumanArmGeometry.ISetup,
      a: number,
    ): (M.ISite | undefined)[] =>
      points.map((p: W.IWaypoint): M.ISite | undefined => p.sites[a]),
  );

  const readers: HumanArmTrajectoryAllowances.IReaders =
    HumanArmTrajectoryAllowances({
      problem,
      setups,
      model,
      points,
      frames,
      sites,
    });

  const context: M.IContext = {
    ...(problem.material === undefined
      ? {}
      : {
          material: {
            parts: problem.material.bones.map((bone) =>
              model.parts.findIndex((part) => part.bone === bone),
            ),
            frame: (
              a: number,
              seconds: number,
            ): IAutoMovieMotionHumanArmGeometry.IFrame => {
              const base: HumanArmTrajectoryContext.IProblem["bases"][number] =
                problem.material!.at(seconds);
              return HumanArmFrame(setups[a]!, base.arms?.[a] ?? base, alone);
            },
          },
        }),
    n,
    still: problem.still === true,
    open,
    ...(problem.arms.some(
      (arm: HumanArmTrajectoryContext.IProblem["arms"][number]): boolean =>
        arm.anchor !== undefined,
    )
      ? {
          anchor: problem.arms.map(
            (
              arm: HumanArmTrajectoryContext.IProblem["arms"][number],
              a: number,
            ): number[] | undefined =>
              arm.anchor === undefined
                ? undefined
                : G.encode(setups[a]!, arm.anchor),
          ),
        }
      : {}),
    times: problem.times,
    // The law's pace the laid course sets (`HumanArmTrajectoryLaid`), kept
    // by a refinement of the same arms; none read yet bounds nothing.
    speed: previous?.speed ?? ((): number => Infinity),
    // A stretch's course beyond its ends, kept by the contexts of the same
    // stretch.
    ...(previous?.beyond === undefined ? {} : { beyond: previous.beyond }),
    setups,
    frames,
    sites,
    rest,
    back,
    free,
    offset,
    width,
    bounds: setups.map(
      (
        setup: IAutoMovieMotionHumanArmGeometry.ISetup,
        a: number,
      ): ([number, number] | null)[] => boxes(setup, rest[a]!, back[a]!),
    ),
    allowed: readers.allowed,
    between: readers.between,
    grasped: readers.grasped,
    inside: readers.inside,
    lying: readers.lying,
    normals: setups.map(
      (
        _: IAutoMovieMotionHumanArmGeometry.ISetup,
        a: number,
      ): (IAutoMovieVector3 | undefined)[] =>
        points.map(
          (p: W.IWaypoint): IAutoMovieVector3 | undefined => p.normals[a],
        ),
    ),
    touched: setups.map(
      (_: IAutoMovieMotionHumanArmGeometry.ISetup, a: number): number[] =>
        points.map((p: W.IWaypoint): number => p.touched[a]!),
    ),
    reachable: setups.map(
      (_: IAutoMovieMotionHumanArmGeometry.ISetup, a: number): number[][] =>
        points.map((p: W.IWaypoint): number[] => p.reachable[a]!),
    ),
    rested: readers.rested,
  };
  return context;
}

/**
 * The context of a problem.
 *
 * @param problem The problem.
 * @param previous The context of the same arms on other waypoints, an earlier
 *   reading of the trajectory a refinement splits, whose speed bound and beyond
 *   reading the new context keeps.
 * @returns The context.
 */
export function HumanArmTrajectoryContext(
  problem: HumanArmTrajectoryContext.IProblem,
  previous?: M.IContext,
): M.IContext {
  return built(problem, previous);
}

/**
 * What an arms' trajectory reads, built once per problem
 * (`HumanArmTrajectoryModel.IContext`): each arm's setup and frames, its
 * variables, its hard bounds, every probe's allowance against every shape, and
 * each site's touched collider and normal.
 */
export namespace HumanArmTrajectoryContext {
  /**
   * What the context is built from: the trajectory's problem, or a still
   * configuration of it.
   */
  export interface IProblem {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The waypoints' seconds. */
    times: readonly number[];

    /** What every arm is read against at each waypoint. */
    bases: readonly G.IBase[];
    /** Native body geometry for the authored hand support, when present. */
    material?: M.IMaterialSource;

    /** The arms. */
    arms: readonly IProblemArmsItem[];

    /**
     * Whether the problem is a still configuration
     * (`HumanArmTrajectoryModel.IContext.still`).
     */
    still?: boolean;

    /**
     * The share of the reach made at a second, 0 at rest and 1 on the hold
     * (`HumanArmTrajectory.IProblem.share`); a grasp's closing and parting keep
     * its depth on the hold by it. Nothing is kept when absent.
     *
     * @param seconds Seconds of the problem.
     * @returns The share, 0 to 1.
     */
    share?: (seconds: number) => number;
  }

  /**
   * Bind genuine arm setup metadata for one unchanged-body trajectory
   * operation.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    sides: readonly AutoMovieHumanSide[],
  ): (problem: IProblem, previous?: M.IContext) => M.IContext {
    const names: readonly AutoMovieHumanSide[] = [...sides];
    const setups: IAutoMovieMotionHumanArmGeometry.ISetup[] = names.map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanArmGeometry.ISetup =>
        G.prepare(body, side),
    );
    return (problem: IProblem, previous?: M.IContext): M.IContext =>
      built(
        problem,
        previous,
        problem.body === body &&
          problem.arms.length === names.length &&
          names.every(
            (side: AutoMovieHumanSide, index: number): boolean =>
              problem.arms[index]!.side === side,
          )
          ? setups
          : undefined,
      );
  }
}

/** The record of `IBoxesR`'s site. */
type IBoxesR = { min: number; max: number };

/** The alternatives of `BoxesKey`'s site. */
type BoxesKey = "flexion" | "abduction" | "twist";

/** The record of `IBoxesTwist`'s site. */
type IBoxesTwist = { min: number; max: number };

/**
 * Each coordinate's hard bounds, every QP's box constraints as in TrajOpt: the
 * twist interval and the elbow's and wrist's ranges of the skeleton, not
 * widened, so no iterate leaves the range forward kinematics clamps to; the
 * rest and the back arm enter clamped (`HumanArmGeometry.encode`). The
 * shoulder's twist stays widened to the rest and the back arm's chart reading,
 * which a clamped clinical triple meets only to its rounding. None for the
 * chart's two, which the chart's disc bounds.
 */
function boxes(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  rest: readonly number[],
  back: readonly number[],
): ([number, number] | null)[] {
  const out: ([number, number] | null)[] = new Array(G.DIMENSIONS).fill(null);
  const twist: IBoxesTwist = setup.constraint.upper.swingTwist!.twist;
  out[2] = [
    Math.min(twist.min, rest[2]!, back[2]!),
    Math.max(twist.max, rest[2]!, back[2]!),
  ];
  (["flexion", "abduction", "twist"] as const).forEach(
    (key: BoxesKey, i: number): void => {
      for (const [constraint, o] of [
        [setup.constraint.lower, 3],
        [setup.constraint.hand, 6],
      ] as const) {
        const r: IBoxesR | null | undefined = constraint?.[key];
        if (r !== null && r !== undefined) out[o + i] = [r.min, r.max];
      }
    },
  );
  return out;
}

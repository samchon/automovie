import { ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  HumanArmGeometry,
  HumanArmTrajectory,
  HumanArmTrajectoryContactContinuation,
  HumanArmTrajectoryContext,
  HumanArmTrajectoryModel,
  HumanArmTrajectoryPairs,
  HumanRefusal,
} from "@automovie/motions/internal";
import fs from "node:fs/promises";
import path from "node:path";

import { humanFixtureBody } from "../fixtures/humanFixtureBody";
import { motionHumanBody } from "../motionHumanBody";
import { repositoryRoot } from "../repositoryRoot";

/**
 * An arm-planner problem a law handed the planner, stored once under
 * `armPlanner/` and read back as the planner's own inputs: the body, the knots,
 * the frame grid with each instant's trunk pose and the other bodies' colliders
 * within the arms' reach envelope (each planned shoulder's arm length plus the
 * convex model's contact distance, `HumanArmTrajectoryTerms.CHECK`), each arm's
 * rest, return, goal arm and sites, and the laid course's hold. A collider's
 * shapes and a pose are stored once and named by index at every instant that
 * reads them.
 */
export namespace armPlannerFixture {
  /** A loaded problem, ready to solve. */
  export interface ILoaded {
    /** The body. */
    body: IAutoMovieMotionHumanBody;
    /** The stored record. */
    stored: IStored;
    /** The problem on given seconds, each one of the grid's. */
    problem: (times: readonly number[]) => HumanArmTrajectory.IProblem;
    /** The problem on the whole grid. */
    whole: HumanArmTrajectory.IProblem;
    /** The laid course the law's arm course hands the solve; none without one. */
    laid: () => HumanArmTrajectory.IAdmitted | undefined;
  }

  /**
   * Read a stored problem.
   *
   * @param name The file's name under `armPlanner/`, without `.json`.
   * @returns The problem.
   */
  export async function load(name: string): Promise<ILoaded> {
    const stored: IStored = JSON.parse(
      await fs.readFile(
        path.join(
          repositoryRoot(),
          `test/src/features/internal/armPlanner/${name}.json`,
        ),
        "utf8",
      ),
    );
    const body: IAutoMovieMotionHumanBody =
      stored.source === "fixture"
        ? await humanFixtureBody(stored.body)
        : motionHumanBody(stored.body);
    const nearest = (seconds: number): number => {
      let best: number = 0;
      stored.grid.forEach((g: number, k: number): void => {
        if (Math.abs(g - seconds) < Math.abs(stored.grid[best]! - seconds))
          best = k;
      });
      return best;
    };
    const collider = (
      c: IStoredCollider,
    ): IAutoMovieMotionHumanColliders.IPlaced => ({
      ...c,
      shapes: stored.shapes[c.shapes]!,
    });
    const own = (
      b: IStoredArmBase,
    ): HumanArmTrajectory.IProblem["bases"][number] => {
      const { others, rests, ...rest }: IStoredArmBase = b;
      return {
        ...rest,
        others: others.map(collider),
        ...(rests === undefined ? {} : { rests: rests.map(collider) }),
      };
    };
    const base = (
      b: IStoredBase,
    ): HumanArmTrajectory.IProblem["bases"][number] => {
      const { pose, others, rests, arms, ...rest }: IStoredBase = b;
      return {
        ...rest,
        pose: stored.poses[pose]!,
        others: others.map(collider),
        ...(rests === undefined ? {} : { rests: rests.map(collider) }),
        ...(arms === undefined ? {} : { arms: arms.map(own) }),
      };
    };
    const problem = (times: readonly number[]): HumanArmTrajectory.IProblem => {
      const at: number[] = times.map(nearest);
      return {
        body,
        times,
        bases: at.map((k: number) => base(stored.problem.bases[k]!)),
        arms: stored.problem.arms.map(
          (arm: IStoredArm): HumanArmTrajectory.IArm => ({
            ...arm,
            sites: at.map(
              (k: number): HumanArmTrajectory.ISite | undefined =>
                arm.sites[k] ?? undefined,
            ),
          }),
        ),
        share: (seconds: number): number => stored.share[nearest(seconds)]!,
      };
    };
    const whole: HumanArmTrajectory.IProblem = problem(stored.grid);
    const course: IStoredCourse | null = stored.course;
    const laid = (): HumanArmTrajectory.IAdmitted | undefined => {
      if (course === null) return undefined;
      const held: number[] = stored.grid
        .map((_: number, k: number): number => k)
        .filter((k: number): boolean =>
          course.held.some(
            (arm: (IAutoMovieMotionHumanArmClearance.IArm | null)[]): boolean =>
              arm[k] !== null,
          ),
        );
      return HumanArmTrajectoryContactContinuation(
        whole,
        held,
        HumanArmTrajectory.admitted(
          whole,
          course.held.map(
            (
              arm: (IAutoMovieMotionHumanArmClearance.IArm | null)[],
            ): (IAutoMovieMotionHumanArmClearance.IArm | undefined)[] =>
              arm.map(
                (
                  h: IAutoMovieMotionHumanArmClearance.IArm | null,
                ): IAutoMovieMotionHumanArmClearance.IArm | undefined =>
                  h ?? undefined,
              ),
          ),
          course.tempo ?? undefined,
          course.pace ?? undefined,
        ),
        course.tempo ?? undefined,
      );
    };
    return { body, stored, problem, whole, laid };
  }

  /**
   * Solve a loaded problem as the law's plan does.
   *
   * @param loaded The problem.
   * @returns The solution.
   * @throws {HumanRefusal} When the planner refuses it.
   */
  export function solve(loaded: ILoaded): HumanArmTrajectory.ISolved {
    return HumanArmTrajectory.solve(
      loaded.problem,
      loaded.stored.knots,
      loaded.laid(),
      undefined,
      loaded.stored.stretches,
    );
  }

  /**
   * Read the typed duration refusal from one solve at the stored clock.
   *
   * @param name The stored problem's name.
   * @returns The authored span and the first playable frame-aligned span.
   */
  export async function duration(name: string): Promise<IDuration> {
    const loaded: ILoaded = await load(name);
    const span: number = loaded.stored.grid.at(-1)! - loaded.stored.grid[0]!;
    try {
      solve(loaded);
    } catch (error: unknown) {
      if (
        error instanceof HumanRefusal &&
        error.kind === "reach" &&
        error.axis === "duration" &&
        error.value === span &&
        error.feasible?.kind === "range" &&
        error.feasible.unit === "s" &&
        error.feasible.minimum !== null
      )
        return { span, minimum: error.feasible.minimum };
      throw error;
    }
    throw new Error(`${name} was admitted at its stored duration.`);
  }

  /** The span tested and the minimum the refusal requests, seconds. */
  export interface IDuration {
    /** The span tested. */
    span: number;
    /** The minimum duration requested. */
    minimum: number;
  }

  /**
   * A stored problem solved once and read against the planner's contracts
   * (`broken`): its refusal, or each contract its solution breaks.
   *
   * @param name The file's name under `armPlanner/`, without `.json`.
   * @returns Each failure's words; none when the problem is planned.
   */
  export async function planned(name: string): Promise<string[]> {
    const loaded: ILoaded = await load(name);
    let solved: HumanArmTrajectory.ISolved;
    try {
      solved = solve(loaded);
    } catch (error: unknown) {
      return [String(error)];
    }
    return broken(loaded, solved);
  }

  /**
   * What a solution breaks of the planner's contracts, read on the played arms
   * independently of the solve's own verdict: a hold frame's hand outside its
   * site's disc, an instant every 5 ms outside a joint's range to its
   * resolution (`ROM_TOLERANCE`), the model's reading of the played grid past
   * its tolerance (every pair, sweep, site, range and speed), and a knot where
   * a played clinical angle's one-sided velocity or acceleration (second-order
   * differences 10 µs apart) disagree past 0.1 % of their scale, or past 1 % of
   * it and a degree a second squared.
   *
   * @param loaded The problem.
   * @param solved Its solution.
   * @returns Each broken contract's words; none when all hold.
   */
  export function broken(
    loaded: ILoaded,
    solved: HumanArmTrajectory.ISolved,
  ): string[] {
    const { body, stored, whole } = loaded;
    const out: string[] = [];
    const c: HumanArmTrajectoryModel.IContext =
      HumanArmTrajectoryContext.prepare(
        body,
        stored.problem.arms.map(
          (arm: IStoredArm): AutoMovieHumanSide => arm.side,
        ),
      )(whole);
    const played = (
      a: number,
      seconds: number,
    ): IAutoMovieMotionHumanArmClearance.IArm =>
      solved.trajectories[a]!(seconds);
    const x: number[][][] = stored.problem.arms.map(
      (_: IStoredArm, a: number): number[][] =>
        stored.grid.map((t: number): number[] =>
          HumanArmGeometry.encode(c.setups[a]!, played(a, t)),
        ),
    );

    // The hands on their sites.
    const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[][] = x.map(
      (
        arm: number[][],
        a: number,
      ): IAutoMovieMotionHumanArmGeometry.IPlaced[] =>
        arm.map(
          (q: number[], g: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
            HumanArmGeometry.placed(c.setups[a]!, c.frames[a]![g]!, q, true),
        ),
    );
    x.forEach((arm: number[][], a: number): void =>
      arm.forEach((_: number[], g: number): void => {
        const site: HumanArmTrajectory.ISite | undefined = c.sites[a]![g];
        if (site === undefined) return;
        const at: HumanArmTrajectoryPairs.ILocated =
          HumanArmTrajectoryPairs.located(
            c,
            (b: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
              placed[b]![g]!,
            a,
            g,
            site,
          );
        const miss: number =
          Vector3.distance(
            HumanArmTrajectoryPairs.pad(placed[a]![g]!, site.contact),
            at.point,
          ) - site.disc;
        if (miss > HumanArmTrajectoryModel.TOLERANCE / 1000)
          out.push(
            `the ${c.setups[a]!.bones.hand} ${(1000 * miss).toFixed(1)} mm past its disc at ${stored.grid[g]!.toFixed(3)} s`,
          );
      }),
    );

    // The ranges of motion every 5 ms.
    const end: number = stored.grid[stored.grid.length - 1]!;
    stored.problem.arms.forEach((arm: IStoredArm, a: number): void => {
      const setup: IAutoMovieMotionHumanArmGeometry.ISetup = c.setups[a]!;
      for (let s: number = stored.grid[0]!; s <= end + 1e-9; s += 0.005) {
        const shown: IAutoMovieMotionHumanArmClearance.IArm = played(a, s);
        const lower: number[] = HumanArmGeometry.clamped(
          setup,
          setup.bones.lower,
          shown.lower,
        );
        const hand: number[] = HumanArmGeometry.clamped(
          setup,
          setup.bones.hand,
          shown.hand,
        );
        const excess: number = Math.max(
          ...lower.map((v: number, d: number): number =>
            Math.abs(v - shown.lower[d]!),
          ),
          ...hand.map((v: number, d: number): number =>
            Math.abs(v - shown.hand[d]!),
          ),
        );
        if (excess > ROM_TOLERANCE)
          out.push(
            `the ${arm.side} arm ${excess.toFixed(3)} degrees out of range at ${s.toFixed(3)} s`,
          );
      }
    });

    // The model's reading of the played grid.
    const reading: HumanArmTrajectoryModel.IEvaluation =
      HumanArmTrajectoryModel.evaluate(c, x);
    if (reading.worst.value > HumanArmTrajectoryModel.TOLERANCE)
      out.push(`the grid reading: ${reading.worst.what}`);

    // C2 across the knots.
    const h: number = 1e-5;
    solved.state.times.slice(1, -1).forEach((t: number): void =>
      stored.problem.arms.forEach((_: IStoredArm, a: number): void => {
        const f: number[][] = [-3, -2, -1, 0, 1, 2, 3].map(
          (i: number): number[] => {
            const shown: IAutoMovieMotionHumanArmClearance.IArm = played(
              a,
              t + i * h,
            );
            return [...shown.upper, ...shown.lower, ...shown.hand];
          },
        );
        f[3]!.forEach((_v: number, d: number): void => {
          const v = (i: number): number => f[i + 3]![d]!;
          const left: number = (3 * v(0) - 4 * v(-1) + v(-2)) / (2 * h);
          const right: number = (-3 * v(0) + 4 * v(1) - v(2)) / (2 * h);
          const leftA: number =
            (2 * v(0) - 5 * v(-1) + 4 * v(-2) - v(-3)) / (h * h);
          const rightA: number =
            (2 * v(0) - 5 * v(1) + 4 * v(2) - v(3)) / (h * h);
          if (
            Math.abs(right - left) >
              1e-3 * (1 + Math.abs(left) + Math.abs(right)) ||
            Math.abs(rightA - leftA) >
              1 + 1e-2 * (Math.abs(leftA) + Math.abs(rightA))
          )
            out.push(`a kink at ${t.toFixed(3)} s in angle ${d}`);
        });
      }),
    );
    return out;
  }

  /** The stored record. */
  export interface IStored {
    /** The refusal the problem was captured at. */
    refusal: string;
    /** Which body builder made the body. */
    source: "fixture" | "people";
    /** The body's name. */
    body: "m-average" | "f-small";
    /** The first knots, seconds. */
    knots: number[];
    /** The frame grid, seconds. */
    grid: number[];
    /** Whether the span is the law's own. */
    stretches: boolean;
    /** The reach's share at each grid instant. */
    share: number[];
    /** The laid course; none where the law lays none. */
    course: IStoredCourse | null;
    /** The distinct trunk poses. */
    poses: IAutoMoviePose[];
    /** The distinct collider shape lists. */
    shapes: IAutoMovieMotionHumanColliders.IPlaced["shapes"][];
    /** The problem on the grid. */
    problem: {
      /** The arms. */
      arms: IStoredArm[];
      /** Each grid instant's base. */
      bases: IStoredBase[];
    };
  }

  /** The laid course's hold, as the law's arm course admits it. */
  export interface IStoredCourse {
    /** The model term that refused it. */
    refused: string;
    /** Each arm's hold at each grid instant, null off it. */
    held: (IAutoMovieMotionHumanArmClearance.IArm | null)[][];
    /** The law's tempo; the default where null. */
    tempo: number | null;
    /** The pace inherited from an earlier plan; none where null. */
    pace: HumanArmTrajectoryModel.IContext["speed"] | null;
  }

  /** One arm on the grid. */
  export interface IStoredArm extends Omit<HumanArmTrajectory.IArm, "sites"> {
    /** Its site at each grid instant, null off the hold. */
    sites: (HumanArmTrajectory.ISite | null)[];
  }

  /** A collider, its shapes by index. */
  export interface IStoredCollider extends Omit<
    IAutoMovieMotionHumanColliders.IPlaced,
    "shapes"
  > {
    /** Its shapes' index in `IStored.shapes`. */
    shapes: number;
  }

  /** One arm's own reading of a base. */
  export interface IStoredArmBase extends Omit<
    HumanArmTrajectory.IProblem["bases"][number],
    "others" | "rests"
  > {
    /** Its obstacles. */
    others: IStoredCollider[];
    /** Its rests. */
    rests?: IStoredCollider[];
  }

  /** A base, its pose and colliders by index. */
  export interface IStoredBase extends Omit<
    HumanArmTrajectory.IProblem["bases"][number],
    "pose" | "others" | "rests" | "arms"
  > {
    /** Its pose's index in `IStored.poses`. */
    pose: number;
    /** The other bodies' colliders within the reach envelope. */
    others: IStoredCollider[];
    /** The ones the hand rests on. */
    rests?: IStoredCollider[];
    /** Each planned arm's own reading. */
    arms?: IStoredArmBase[];
  }
}

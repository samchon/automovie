import { ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanArmGeometry,
  HumanArmTrajectory,
  HumanArmTrajectoryContactContinuation,
  HumanArmTrajectoryContext,
  HumanArmTrajectoryModel,
  HumanArmTrajectoryPairs,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs/promises";
import path from "node:path";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { repositoryRoot } from "../../../internal/repositoryRoot";

/**
 * The arm planner on the problem choku-zuki hands it, stored once
 * (`armPlanner/chokuZuki.json`): the average man's left arm over the 2.2 s
 * action, its 35 knots, the 67 instants of its frame grid with the trunk's pose
 * at each, the hand's site and its 10 mm disc over the punch, the rest, the
 * law's goal arm and the laid course's hold. The course laid from that hold is
 * refused for its sweep, so the planner itself must find the path: the seed,
 * the SQP and the refinement on the knots. Its result is then read on the frame
 * grid independently of the solve's own verdict.
 *
 * Scenarios:
 *
 * 1. The laid course is refused for its sweep (the problem reaches the solve), and
 *    the solve admits a trajectory, raising no refusal.
 * 2. At every grid instant of the hold, the hand's contact point lies within its
 *    site's 10 mm disc.
 * 3. Every 5 ms over the action the played arm lies inside its joints' ranges to
 *    their resolution (`ROM_TOLERANCE`): clamping it moves nothing.
 * 4. The model's own reading of the played grid (every pair, sweep, site, range
 *    and speed) is within its tolerance: nothing interpenetrates.
 * 5. Across every inner knot the played coordinates are C2: their one-sided first
 *    and second differences agree to the step's order.
 * 6. Solving the same problem again gives the same solution, bit for bit.
 */
export async function test_unit_motions_posture_arm_planner_choku_zuki(): Promise<void> {
  const fixture: IFixture = JSON.parse(
    await fs.readFile(
      path.join(
        repositoryRoot(),
        "test/src/features/internal/armPlanner/chokuZuki.json",
      ),
      "utf8",
    ),
  );
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const nearest = (seconds: number): number => {
    let best: number = 0;
    fixture.grid.forEach((g: number, k: number): void => {
      if (Math.abs(g - seconds) < Math.abs(fixture.grid[best]! - seconds))
        best = k;
    });
    return best;
  };
  const problem = (times: readonly number[]): HumanArmTrajectory.IProblem => {
    const at: number[] = times.map(nearest);
    return {
      body,
      times,
      bases: at.map((k: number) => ({
        pose: fixture.poses[fixture.pose[k]!]!,
        others: [],
      })),
      arms: fixture.arms.map(
        (arm: IFixture.IArm): HumanArmTrajectory.IArm => ({
          side: arm.side,
          rest: arm.rest,
          guess: arm.guess,
          sites: at.map(
            (k: number): HumanArmTrajectory.ISite | undefined =>
              arm.sites[k] ?? undefined,
          ),
        }),
      ),
      share: (seconds: number): number => fixture.share[nearest(seconds)]!,
    };
  };
  const whole: HumanArmTrajectory.IProblem = problem(fixture.grid);
  const held: number[] = fixture.grid
    .map((_: number, k: number): number => k)
    .filter((k: number): boolean => fixture.arms[0]!.held[k] !== null);
  const laid = (): HumanArmTrajectory.IAdmitted =>
    HumanArmTrajectoryContactContinuation(
      whole,
      held,
      HumanArmTrajectory.admitted(
        whole,
        fixture.arms.map(
          (
            arm: IFixture.IArm,
          ): (IAutoMovieMotionHumanArmClearance.IArm | undefined)[] =>
            arm.held.map(
              (
                h: IAutoMovieMotionHumanArmClearance.IArm | null,
              ): IAutoMovieMotionHumanArmClearance.IArm | undefined =>
                h ?? undefined,
            ),
        ),
      ),
    );
  const course: HumanArmTrajectory.IAdmitted = laid();
  TestValidator.equals("the laid course's refusal", course.refused, "swept");

  // 1. The solve.
  const solve = (): HumanArmTrajectory.ISolved =>
    HumanArmTrajectory.solve(
      problem,
      fixture.knots,
      laid(),
      undefined,
      fixture.stretches,
    );
  let solved: HumanArmTrajectory.ISolved | undefined;
  let refusal: string = "";
  try {
    solved = solve();
  } catch (error: unknown) {
    refusal = String(error);
  }
  TestValidator.equals("the solve admits a trajectory", refusal, "");
  if (solved === undefined) return;

  // The played trajectory on the frame grid, in the optimiser's coordinates.
  const c: HumanArmTrajectoryModel.IContext = HumanArmTrajectoryContext.prepare(
    body,
    fixture.arms.map((arm: IFixture.IArm): AutoMovieHumanSide => arm.side),
  )(whole);
  const coordinates = (a: number, seconds: number): number[] =>
    HumanArmGeometry.encode(c.setups[a]!, solved!.trajectories[a]!(seconds));
  const x: number[][][] = fixture.arms.map(
    (_: IFixture.IArm, a: number): number[][] =>
      fixture.grid.map((t: number): number[] => coordinates(a, t)),
  );

  // 2. The hand on its site.
  const off: number[] = [];
  x.forEach((arm: number[][], a: number): void =>
    arm.forEach((q: number[], g: number): void => {
      const site: HumanArmTrajectory.ISite | undefined = c.sites[a]![g];
      if (site === undefined) return;
      const hand: IAutoMovieVector3 = HumanArmTrajectoryPairs.pad(
        HumanArmGeometry.placed(c.setups[a]!, c.frames[a]![g]!, q, true),
        site.contact,
      );
      const miss: number = Vector3.distance(hand, site.point) - site.disc;
      if (miss > HumanArmTrajectoryModel.TOLERANCE / 1000) off.push(g);
    }),
  );
  TestValidator.equals("every hold frame's hand within its disc", off, []);

  // 3. The ranges of motion, on the played arm every 5 ms: the clinical
  // triples as played, against the same triples clamped to their joints.
  const raw = (a: number, seconds: number): number[] => {
    const arm: IAutoMovieMotionHumanArmClearance.IArm =
      solved!.trajectories[a]!(seconds);
    return [...arm.upper, ...arm.lower, ...arm.hand];
  };
  const outside: string[] = [];
  fixture.arms.forEach((arm: IFixture.IArm, a: number): void => {
    for (let s: number = 0; s <= 2.2 + 1e-9; s += 0.005) {
      const played: IAutoMovieMotionHumanArmClearance.IArm =
        solved!.trajectories[a]!(s);
      const setup: IAutoMovieMotionHumanArmGeometry.ISetup = c.setups[a]!;
      const lower: number[] = HumanArmGeometry.clamped(
        setup,
        setup.bones.lower,
        played.lower,
      );
      const hand: number[] = HumanArmGeometry.clamped(
        setup,
        setup.bones.hand,
        played.hand,
      );
      const excess: number = Math.max(
        ...lower.map((v: number, d: number): number =>
          Math.abs(v - played.lower[d]!),
        ),
        ...hand.map((v: number, d: number): number =>
          Math.abs(v - played.hand[d]!),
        ),
      );
      if (excess > ROM_TOLERANCE) outside.push(`${arm.side} ${s.toFixed(3)} s`);
    }
  });
  TestValidator.equals("every instant within its ranges", outside, []);

  // 4. The model's reading: clearance, sites, ranges and speed.
  const reading: HumanArmTrajectoryModel.IEvaluation =
    HumanArmTrajectoryModel.evaluate(c, x);
  TestValidator.predicate(
    `the grid reading within tolerance (${reading.worst.what})`,
    reading.worst.value <= HumanArmTrajectoryModel.TOLERANCE,
  );

  // 5. C2 across the knots: the played triples' one-sided derivatives,
  // second-order differences 10 µs apart, on both sides of every inner knot.
  const h: number = 1e-5;
  const kinked: string[] = [];
  solved.state.times.slice(1, -1).forEach((t: number): void =>
    fixture.arms.forEach((_: IFixture.IArm, a: number): void => {
      const f: number[][] = [-3, -2, -1, 0, 1, 2, 3].map(
        (i: number): number[] => raw(a, t + i * h),
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
          kinked.push(`${t.toFixed(3)} s triple ${d}`);
      });
    }),
  );
  TestValidator.equals("C2 across every knot", kinked, []);
  // 6. Determinism.
  TestValidator.equals("the same solution again", solve().state, solved.state);
}

/** The stored problem: the frame grid's instants and each one's inputs. */
interface IFixture {
  /** The frame grid, seconds. */
  grid: number[];
  /** The first knots, seconds. */
  knots: number[];
  /** Whether the span is the law's own. */
  stretches: boolean;
  /** The reach's share at each grid instant. */
  share: number[];
  /** The distinct trunk poses. */
  poses: IAutoMoviePose[];
  /** Each grid instant's pose, an index into `poses`. */
  pose: number[];
  /** The arms. */
  arms: IFixture.IArm[];
}
namespace IFixture {
  /** One arm's inputs on the grid. */
  export interface IArm {
    /** The arm. */
    side: AutoMovieHumanSide;
    /** The arm at the first and last instants. */
    rest: IAutoMovieMotionHumanArmClearance.IArm;
    /** The law's goal arm at the hold's start. */
    guess: IAutoMovieMotionHumanArmClearance.IArm;
    /** Its site at each instant, null off the hold. */
    sites: (HumanArmTrajectory.ISite | null)[];
    /** The laid course's hold at each instant, null off the hold. */
    held: (IAutoMovieMotionHumanArmClearance.IArm | null)[];
  }
}

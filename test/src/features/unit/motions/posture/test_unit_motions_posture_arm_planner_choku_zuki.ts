import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  HumanArmTrajectory,
  HumanArmTrajectoryContactContinuation,
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
 * the SQP and the refinement on the knots.
 *
 * Scenarios:
 *
 * 1. The laid course is refused for its sweep (the problem reaches the solve).
 * 2. The solve admits a trajectory: every frame's hand within its 10 mm disc and
 *    the arm clear, so it raises no refusal.
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
  const laid: HumanArmTrajectory.IAdmitted =
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
  TestValidator.equals("the laid course's refusal", laid.refused, "swept");

  let refusal: string = "";
  try {
    HumanArmTrajectory.solve(
      problem,
      fixture.knots,
      laid,
      undefined,
      fixture.stretches,
    );
  } catch (error: unknown) {
    refusal = String(error);
  }
  TestValidator.equals("the hand within its 10 mm disc", refusal, "");
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

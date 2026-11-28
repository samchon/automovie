import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  HumanArmSeed
} from "../../../../../packages/motions/src/posture/internal/HumanArmSeed";
import {
  HumanArmTrajectoryContext
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryContext";
import {
  HumanArmTrajectoryModel
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryModel";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * The seed sets both fixed ends and turns RRT's timed state at each free
 * knot into nine coordinates per arm.
 *
 * Scenarios:
 *
 * 1. One free waypoint between the entry and a fixed return. Its final
 *    coordinate is the locked wrist twist, exactly zero along the route.
 * 2. The entry, pinned waypoint and exit keep all their coordinates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines reconstruction of an arm's timed free state and preservation of fixed positions and locked twist.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a timed path with entry, pinned waypoint, free waypoint and return and reads its nine coordinates per arm.
 * @evidence contracts/development/testing.md#independent-expectations Authored fixed coordinates are exact at all anchors and the last wrist coordinate stays zero through the independent free route.
 */
export async function test_motions_posture_arm_seed_path(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const pose: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: null,
    joints: [],
  };
  const rest: IAutoMovieMotionHumanArmClearance.IArm = {
    upper: [0, 0, 0],
    lower: [0, 0, 0],
    hand: [0, 0, 0],
  };
  const base: HumanArmTrajectoryContext.IProblem["bases"][number] = {
    pose,
    others: [],
  };
  const c: HumanArmTrajectoryModel.IContext = HumanArmTrajectoryContext({
    body,
    times: [0, 1, 2, 3],
    bases: [base, base, base, base],
    arms: [{ side: "right", rest, sites: [] }],
  });
  const held: number[] = [...c.rest[0]!];
  const pinned: HumanArmSeed.IHolds = new Map<number, number[][]>([[2, [held]]]);
  const [entry, free, hold, exit]: number[][] = HumanArmSeed.seed(c, pinned, c)[0]!;
  TestValidator.equals("all arm coordinates retained", free!.length, held.length);
  TestValidator.equals("the locked wrist twist", free![8], held[8]);
  TestValidator.equals("the anchors", [entry, hold, exit], [
    c.rest[0]!,
    held,
    c.back[0]!,
  ]);
}

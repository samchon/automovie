import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanArmGeometry,
  HumanArmSeedContinuation,
  HumanArmTrajectoryContext,
  HumanArmTrajectoryModel,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Four rounded operations bound the unit-scale linear site displacement. */
const POSITION_ROUNDING: number = 4 * Number.EPSILON;

/**
 * Advance the hand's target from its seeded contact to the authored site and
 * carry each correction to the next continuation step.
 *
 * Scenarios:
 *
 * 1. A 0.25-meter change divides into the measured 50 equal steps. The
 *    first target moves by 0.005 m and the last reaches the requested site.
 *    The corrector's first coordinate increments by one each time.
 * 2. A corrector refusing its second target ends the continuation there.
 */
export async function test_motions_posture_arm_seed_continuation(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const pose: IAutoMoviePose = { skeleton: body.skeleton.id, root: null, joints: [] };
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
    times: [0, 1, 2],
    bases: [base, base, base],
    arms: [{ side: "right", rest, sites: [] }],
    still: true,
  });
  const wrist: IAutoMovieVector3 = HumanArmGeometry.chain(
    c.setups[0]!,
    c.frames[0]![1]!,
    c.rest[0]!,
  ).wrist;
  const goal: HumanArmTrajectoryModel.ISite = {
    point: { ...wrist, x: wrist.x + 0.25 },
    contact: { x: 0, y: 0, z: 0 },
    disc: 0,
  };
  const context: HumanArmTrajectoryModel.IContext = {
    ...c,
    sites: [[undefined, goal, undefined]],
  };
  const at = (
    sites: (HumanArmTrajectoryModel.ISite | undefined)[],
  ): HumanArmTrajectoryModel.IContext => ({
    ...context,
    sites: [[undefined, sites[0], undefined]],
  });
  const requested: number[] = [];
  const solved: number[][] | undefined = HumanArmSeedContinuation(
    context,
    c.rest,
    at,
    (trial, q) => {
      requested.push(trial.sites[0]![1]!.point.x);
      const next: number[] = [...q[0]!];
      next[0] = next[0]! + 1;
      return { x: [next], met: true };
    },
  );
  TestValidator.predicate(
    "all target steps and corrections are carried",
    requested.length === 50 &&
      nclose(requested[0]!, wrist.x + 0.005, POSITION_ROUNDING) &&
      nclose(requested[49]!, goal.point.x, POSITION_ROUNDING) &&
      solved?.[0]?.[0] === c.rest[0]![0]! + 50,
  );

  let count: number = 0;
  const refused: number[][] | undefined = HumanArmSeedContinuation(
    context,
    c.rest,
    at,
    (_, q) => ({ x: q.map((row: readonly number[]): number[] => [...row]), met: ++count < 2 }),
  );
  TestValidator.equals("stop at the first impossible continuation", [count, refused], [2, undefined]);
}

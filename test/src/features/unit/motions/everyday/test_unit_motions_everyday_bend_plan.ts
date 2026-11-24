import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { bend } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** Burgess-Limerick's greatest knee flexion classified as a stoop, degrees. */
const STOOP_KNEE: number = 30;

/** The least trunk inclination of a stoop, degrees. */
const STOOP_TRUNK: number = 45;

/** A squat's least knee flexion: a right angle, degrees. */
const SQUAT_KNEE: number = 90;

/** Quiet stance's greatest trunk inclination (Kendall et al. 2005), degrees. */
const STANCE: number = 3;

/** A bearing sole's greatest height over the floor, metres. */
const FLOOR: number = 0.01;

/** Rounding of a knee angle recovered from its joint vectors, degrees. */
const ROUNDING: number = 1e-6;

/**
 * `bend`'s plan lowers a hand to a point by its strategy: a stoop bends the
 * trunk with the knees nearly straight, a squat bends the knees with the trunk
 * upright, and a semi-squat lies between.
 *
 * Scenarios:
 *
 * 1. Each strategy starts upright.
 * 2. At its deepest a stoop bends the knees at most 30 degrees, inclines the
 *    trunk at least 45 and moves the hips back.
 * 3. A squat bends the knees at least a right angle with a more upright trunk;
 *    a semi-squat's knees bend between the two.
 * 4. Both feet bear at the deepest point of every strategy, either hand.
 */
export async function test_unit_motions_everyday_bend_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const ankle: number = body.measure.ankleHeight;
  const observe = (
    strategy: IAutoMovieMotionHumanBend.Strategy,
    side: AutoMovieHumanSide,
  ): { knee: number; trunk: number; retreat: number } => {
    const height: number =
      strategy === "squat"
        ? 0
        : ankle + (strategy === "semiSquat" ? 0.2 : 0.6) * body.measure.shank;
    const plan: IAutoMovieMotionHumanActionPlan = bend.plan(
      motionActionContext(body, {
        target: {
          kind: "point",
          frame: "world",
          at: {
            x: side === "left" ? 0.15 : -0.15,
            y: height,
            z: strategy === "stoop" ? 0.45 : 0.3,
          },
        },
        hand: side,
        strategy,
      }),
    );
    const deepest: number = R.event(plan, "deepest")!;
    TestValidator.predicate(
      `${strategy} ${side}: starts upright`,
      R.trunk(R.bones(body, plan, 0)) <= STANCE,
    );
    TestValidator.predicate(
      `${strategy} ${side}: both feet bear at the deepest`,
      R.bears(body, plan, deepest, "left", FLOOR) &&
        R.bears(body, plan, deepest, "right", FLOOR),
    );
    const pose = R.pose(body, plan, deepest);
    return {
      knee: (R.knee(pose, "left") + R.knee(pose, "right")) / 2,
      trunk: R.trunk(R.bones(body, plan, deepest)),
      retreat:
        R.bones(body, plan, 0).get("hips")!.worldPosition.z -
        R.bones(body, plan, deepest).get("hips")!.worldPosition.z,
    };
  };
  const stoop = observe("stoop", "right");
  const semi = observe("semiSquat", "left");
  const squat = observe("squat", "right");
  TestValidator.predicate(
    `a stoop (${stoop.knee}, ${stoop.trunk}, ${stoop.retreat})`,
    stoop.knee <= STOOP_KNEE + ROUNDING &&
      stoop.trunk >= STOOP_TRUNK &&
      stoop.retreat > 0,
  );
  TestValidator.predicate(
    `a squat (${squat.knee}, ${squat.trunk})`,
    squat.knee >= SQUAT_KNEE && squat.trunk < stoop.trunk,
  );
  TestValidator.predicate(
    `a semi-squat between (${semi.knee})`,
    stoop.knee < semi.knee && semi.knee < squat.knee,
  );
}

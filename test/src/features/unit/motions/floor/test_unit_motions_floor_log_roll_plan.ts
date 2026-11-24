import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { lieDown, logRoll } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/**
 * How close a roll's advance keeps to half the chest's perimeter per half
 * turn, as a share (provisional: the chest's cross-section is no exact
 * ellipse).
 */
const ROLLING: number = 0.15;

/** The least upward component of the chest's forward on the back. */
const SUPINE: number = 0.8;

/**
 * `logRoll`'s plan rolls a body lying on its back about its long axis: each
 * half turn carries the pelvis half the chest's perimeter, Ramanujan's ellipse
 * of its breadth and depth, as a rolling log advances.
 *
 * Scenarios:
 *
 * 1. Four half turns toward the left advance the pelvis by twice the chest's
 *    perimeter, within `ROLLING`.
 * 2. After an even number of half turns the body ends on its back.
 */
export async function test_unit_motions_floor_log_roll_plan(): Promise<void> {
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    const lying: IAutoMovieMotionHumanActionPlan = lieDown.plan(
      motionActionContext(body, { kind: "supine" }),
    );
    const roll: IAutoMovieMotionHumanActionPlan = logRoll.plan(
      motionActionContext.after(body, lying, { toward: "left", halfTurns: 4 }),
    );
    const a: IAutoMovieVector3 = R.bones(body, roll, 0).get("hips")!
      .worldPosition;
    const b: IAutoMovieVector3 = R.bones(body, roll, roll.duration).get("hips")!
      .worldPosition;
    const half: number = body.measure.chestBreadth / 2;
    const deep: number = body.measure.chestDepth / 2;
    const perimeter: number =
      Math.PI *
      (3 * (half + deep) - Math.sqrt((3 * half + deep) * (half + 3 * deep)));
    const expected: number = 4 * (perimeter / 2);
    const advance: number = Math.hypot(b.x - a.x, b.z - a.z);
    TestValidator.predicate(
      `${name}: advances ${advance} m for ${expected} m`,
      Math.abs(advance - expected) <= ROLLING * expected,
    );
    const chest: IAutoMovieVector3 = Quaternion.rotateVector(
      R.bones(body, roll, roll.duration).get("chest")!.worldRotation,
      { x: 0, y: 0, z: 1 },
    );
    TestValidator.predicate(`${name}: ends on the back`, chest.y > SUPINE);
  }
}

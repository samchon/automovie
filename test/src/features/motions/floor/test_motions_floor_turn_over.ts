import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnOver,
} from "@automovie/interface";
import { AutoMovieMotionHumanBody } from "@automovie/motions";
import {
  HumanColliders
} from "../../../../../packages/motions/src/posture/internal/HumanColliders";
import {
  lieDown
} from "../../../../../packages/motions/src/floor/internal/lieDown";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import {
  turnOver
} from "../../../../../packages/motions/src/floor/internal/turnOver";
import {
  turnOverToward
} from "../../../../../packages/motions/src/floor/internal/turnOverToward";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";

/**
 * Check directed yaw choice and floor support during a turnover.
 *
 * Scenarios:
 *
 * 1. Resolve a short turn, a wrap across 360 degrees and the two directions
 *    of an exact half turn.
 * 2. Fit a body already supine with a supine destination. Read 0.37 s, the
 *    end, the start and 0.37 s again. Joints stay finite and the lowest
 *    displayed collider stays at floor height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios state the directed yaw cases and the out-of-order floor reads.
 * @evidence contracts/development/testing.md#behavioral-verification The checks cover facing through the wrap and physical playback along the floor.
 * @evidence contracts/development/testing.md#independent-expectations Expected target headings come from equivalent angles and the physical reader checks the collider minimum against y = 0.
 */
export async function test_motions_floor_turn_over(): Promise<void> {
  TestValidator.equals(
    "the nearest",
    [turnOverToward(10, 90, "left"), turnOverToward(350, 0, "left")],
    [90, 360],
  );
  TestValidator.equals(
    "a half turn over a side",
    [turnOverToward(0, 180, "left"), turnOverToward(0, 180, "right")],
    [180, -180],
  );
  const fixture: Awaited<ReturnType<typeof humanFixture>> =
    await humanFixture("m-average");
  const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
    fixture.skeleton,
    fixture.profile,
  );
  const supine: IAutoMovieMotionHumanPosture = {
    ...lieDown.POSES.supine,
    root: { x: 0, y: 0, z: 0 },
    pitch: -90,
    yaw: 0,
    limbs: {},
  };
  const plan: IAutoMovieMotionHumanActionPlan = turnOver.plan(
    motionActionContext<IAutoMovieMotionHumanTurnOver>(
      body,
      { to: "supine", hold: 0.25 },
      { posture: supine, base: { kind: "lying" } },
    ),
  );
  for (const seconds of [0.37, plan.duration, 0, 0.37]) {
    const posture: IAutoMovieMotionHumanPosture = plan.posture(seconds);
    TestValidator.predicate(
      `the joints remain finite at ${seconds} s`,
      Object.values(posture.joints).every((joint) =>
        joint.every(Number.isFinite),
      ),
    );
    TestValidator.predicate(
      `the collider bears on the floor at ${seconds} s`,
      nclose(
        HumanColliders.lowest(
          body,
          poseBones(body, resolveHumanPosture.seeded(body, posture).pose),
        ),
        0,
        1e-9,
      ),
    );
  }
}

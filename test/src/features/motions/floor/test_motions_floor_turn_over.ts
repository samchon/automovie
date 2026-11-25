import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnOver,
} from "@automovie/interface";
import { createHumanBody } from "@automovie/motions";
import {
  HumanColliders,
  lieDown,
  poseBones,
  resolveHumanPosture,
  turnOver,
  turnOverToward,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";

/**
 * `turnOverToward` is the target turn nearest the current one among the named
 * turn's whole-turn equivalents, a half turn away going over the named side.
 *
 * Scenarios:
 *
 * 1. From 10 toward 90 the turn is 90; from 350 toward 0 it is 360.
 * 2. From 0 toward 180, a half turn, it goes over the left to 180 and over the
 *    right to -180.
 * 3. Requesting the side the body already lies on gives finite joint angles and
 *    keeps floor contact at out-of-order interior and endpoint readings.
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
  const body: IAutoMovieMotionHumanBody = createHumanBody(
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

import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLogRoll,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBody,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import {
  HumanColliders
} from "../../../../../packages/motions/src/posture/internal/HumanColliders";

import {
  lieDown
} from "../../../../../packages/motions/src/floor/internal/lieDown";
import {
  logRoll
} from "../../../../../packages/motions/src/floor/internal/logRoll";
import {
  logRollTurns
} from "../../../../../packages/motions/src/floor/internal/logRollTurns";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";

/** Rounding of Ramanujan's formula, metres. */
const ROUNDING: number = 1e-12;

/**
 * Check the turn count and displayed floor support of a log roll.
 *
 * Scenarios:
 *
 * 1. Compare the estimated torso perimeter and distance-to-turn conversions
 *    with ellipse geometry, including an explicit count, short travel and a
 *    return to the starting lying orientation.
 * 2. Read a fitted two-half-turn route out of order on both sides of the
 *    halfway point. The lowest exterior stays on the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios distinguish turn selection from displayed contact with the floor.
 * @evidence contracts/development/testing.md#behavioral-verification The test exercises analytical turn selection and floor contact on the posed exterior.
 * @evidence contracts/development/testing.md#independent-expectations The fixture computes an ellipse perimeter from its axes and measures floor height from displayed colliders after fitting.
 */
export async function test_motions_floor_log_roll(): Promise<void> {
  const a: number = 0.16;
  const b: number = 0.11;
  TestValidator.predicate(
    "Ramanujan's perimeter",
    nclose(
      logRollTurns.perimeter({ chestBreadth: 0.32, chestDepth: 0.22 }),
      Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))),
      ROUNDING,
    ),
  );
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const travel: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const refused = (run: () => unknown, axis: string): boolean => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof AutoMovieMotionHumanRefusal && error.axis === axis;
    }
    return false;
  };
  TestValidator.equals(
    "asked",
    logRollTurns.count({ halfTurns: 3 }, 0, 0.4, origin, travel),
    3,
  );
  TestValidator.predicate(
    "none asked",
    refused(
      () => logRollTurns.count({ halfTurns: 0 }, 0, 0.4, origin, travel),
      "halfTurns",
    ),
  );
  const to: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  TestValidator.equals(
    "to a place",
    [
      logRollTurns.count({ to }, 0, 0.4, origin, travel),
      logRollTurns.count({ to, end: "supine" }, 0, 0.4, origin, travel),
    ],
    [3, 2],
  );
  TestValidator.predicate(
    "too near",
    refused(
      () =>
        logRollTurns.count(
          { to: { x: 0.1, y: 0, z: 0 } },
          0,
          0.4,
          origin,
          travel,
        ),
      "to",
    ),
  );
  const fixture: Awaited<ReturnType<typeof humanFixture>> =
    await humanFixture("f-small");
  const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
    fixture.skeleton,
    fixture.profile,
  );
  const entry: IAutoMovieMotionHumanPosture = {
    ...lieDown.POSES.supine,
    root: { x: 0.3, y: 0, z: -0.7 },
    pitch: -90,
    yaw: 31,
    limbs: {},
  };
  const plan: IAutoMovieMotionHumanActionPlan = logRoll.plan(
    motionActionContext<IAutoMovieMotionHumanLogRoll>(
      body,
      { toward: "left", halfTurns: 2 },
      { posture: entry, base: { kind: "lying" } },
    ),
  );
  for (const share of [0.82, 0.499, 0.5, 1, 0.501, 0.82]) {
    const posture: IAutoMovieMotionHumanPosture = plan.posture(
      plan.duration * share,
    );
    TestValidator.predicate(
      `floor contact at ${share} of a roll`,
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

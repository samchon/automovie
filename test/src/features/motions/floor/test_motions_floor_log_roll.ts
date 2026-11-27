import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLogRoll,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanBody } from "@automovie/motions";
import {
  HumanColliders,
  AutoMovieMotionHumanRefusal,
  lieDown,
  logRoll,
  logRollTurns,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";

/** Rounding of Ramanujan's formula, metres. */
const ROUNDING: number = 1e-12;

/**
 * `logRollTurns` advances a log roll: `perimeter` is the chest's cross-section
 * perimeter by Ramanujan's approximation of its ellipse, `pi (3 (a + b) -
 * sqrt((3a + b)(a + 3b)))`, and `count` takes the asked half turns or as many
 * as bring the pelvis nearest the place, rounded to the end's parity.
 *
 * Scenarios, a chest 0.32 m broad and 0.22 m deep, half turns of 0.4 m, the
 * roll toward +X from the origin on the back:
 *
 * 1. The perimeter of the 0.16 by 0.11 m half-axis ellipse.
 * 2. Three asked half turns are three; none asked is refused on `halfTurns`.
 * 3. A place 1 m along takes round(2.5) = 3; ending on the back, the even count
 *    nearer, 2.
 * 4. A place 0.1 m along, under half a half turn, is refused on `to`.
 * 5. The displayed colliders touch the floor both while the body straightens and
 *    after the unchanged shape starts its second half turn.
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

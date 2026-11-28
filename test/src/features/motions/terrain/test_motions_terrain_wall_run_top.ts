import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  planWallRun
} from "../../../../../packages/motions/src/terrain/internal/planWallRun";
import {
  planWallRunFlight
} from "../../../../../packages/motions/src/terrain/internal/planWallRunFlight";
import {
  stand
} from "../../../../../packages/motions/src/actions/internal/stand";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/**
 * The wall's outgoing and catching frames come from its settled support.
 *
 * Scenarios:
 *
 * 1. Preparation moves the catch horizontally by 0.2 m without altering the
 *    wall-step and catch times. The flight midpoint moves by 0.1 m.
 * 2. Foot ownership ends at takeoff and the hand starts at the catch.
 */
async function preparedFlight(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const base: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  let ahead: number = 1;
  const support: IAutoMovieMotionHumanActionPlan = {
    duration: 1,
    events: [
      { name: "wallStep", share: 0.25 },
      { name: "catch", share: 0.75 },
    ],
    contacts: [
      {
        kind: "plant",
        part: "leftFoot",
        support: { kind: "prop", subject: "wall" },
        from: 0,
        to: 0.5,
      },
      {
        kind: "grip",
        part: "leftHand",
        support: { kind: "prop", subject: "wall" },
        from: 0.5,
        to: 1,
      },
      {
        kind: "grip",
        part: "rightHand",
        support: { kind: "prop", subject: "wall" },
        from: 0.1,
        to: 0.9,
      },
      {
        kind: "plant",
        part: "rightFoot",
        support: { kind: "prop", subject: "wall" },
        from: 0.3,
        to: 0.5,
      },
    ],
    prepare: (): void => {
      ahead = 1.2;
    },
    posture: (at: number): IAutoMovieMotionHumanPosture => ({
      ...base,
      root: { ...base.root, z: at <= 0.25 ? 0 : ahead },
      limbs: {},
    }),
  };
  const flight: IAutoMovieMotionHumanActionPlan = planWallRunFlight(
    body,
    support,
  );
  flight.prepare?.();
  for (const [second, expected] of [
    [0.75, 1.2],
    [0.5, 0.6],
    [0.25, 0],
    [0.375, 0.3],
  ] as const)
    TestValidator.predicate(
      `settled flight frame at ${second}`,
      nclose(flight.posture(second).root.z, expected, 1e-12),
    );
  TestValidator.predicate(
    "the flight owns neither material",
    flight.contacts.length === 4 &&
      flight.contacts[0]!.to === 0.25 &&
      flight.contacts[1]!.from === 0.75 &&
      flight.contacts[2]!.to === 0.25 &&
      flight.contacts[3]!.from === 0.75,
  );
}

/** Four positive terms below 3 m require at most 8 binary64 rounding units. */
const ROUNDING: number = 8 * Number.EPSILON * 3;

/**
 * Compare the staged top to the hand's vertical limit from its wall step.
 *
 * Scenarios:
 *
 * 1. The 0.55 m step plus a 1.25 m shoulder and 0.75 m arm reaches 2.55 m, or 4.55
 *    m in world coordinates when the floor stands at 2 m.
 * 2. A top at 4.6 m is refused with the 2.55 m local bound and its 0.05 m miss.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines maximum geometric reach from a wall step relative to the staged floor and its refusal details.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the wall-run top admission with a translated stage and compares a reachable and slightly higher target.
 * @evidence contracts/development/testing.md#independent-expectations Summing step, shoulder and arm gives 2.55 m local and 4.55 m world. A target at 4.6 m reports the local bound and 0.05 m excess.
 */
export async function test_motions_terrain_wall_run_top(): Promise<void> {
  const measure: planWallRun.IReachMeasure = {
    hipHeight: 1,
    shoulderHeight: 1.25,
    upperArm: 0.5,
    forearm: 0.25,
  };
  planWallRun.admitTop(2.55, 0, measure, "lip");
  planWallRun.admitTop(4.55, 2, measure, "lip");
  let refusal: AutoMovieMotionHumanRefusal | undefined;
  try {
    planWallRun.admitTop(4.6, 2, measure, "lip");
  } catch (error: unknown) {
    if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
    refusal = error;
  }
  const range = refusal?.feasible;
  TestValidator.predicate(
    "report the geometric limit relative to the stage floor",
    refusal?.axis === "top" &&
      refusal.reason.includes("0.050 m") &&
      range?.kind === "range" &&
      range.maximum !== null &&
      nclose(range.maximum, 2.55, ROUNDING),
  );
  await preparedFlight();
}

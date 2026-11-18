import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  composeAutoMovieMotionHumanAction,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * Channel demand reads an active dependency inside its closed interval.
 *
 * Scenarios:
 * 1. Read the head-independent trunk channel at both edges and just outside; request an unrelated channel and overlap the same writer.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Channel demand reads an active dependency inside its closed interval.
 * @evidence contracts/development/testing.md#independent-expectations Base pitch is zero. Inside the closed window trunk pitch is twice the root writer’s X position.
 * @evidence contracts/development/testing.md#distinguishing-cases Excluded demand never invokes either writer; competing writes on the same nonempty interval are ambiguous.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_channel_timing(): void {
  const base: IAutoMovieMotionHumanActionPlan = {
    duration: 1,
    events: [],
    contacts: [],
    posture: () => ({
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    }),
  };
  const clock = AutoMovieMotionClock.of(1, []);
  let rootReads: number = 0,
    trunkReads: number = 0;
  const root: IAutoMovieMotionHumanPrimitive = {
    channels: ["root"],
    reads: [],
    from: 0,
    to: 1,
    write: (p, t): IAutoMovieMotionHumanPosture => {
      rootReads++;
      return { ...p, root: { x: 1 + t, y: 0, z: 0 } };
    },
  };
  const trunk: IAutoMovieMotionHumanPrimitive = {
    channels: ["trunk"],
    reads: ["root"],
    from: 0.25,
    to: 0.75,
    write: (p): IAutoMovieMotionHumanPosture => {
      trunkReads++;
      return { ...p, pitch: 2 * p.root.x };
    },
  };
  const plan = composeAutoMovieMotionHumanAction({
    base,
    clock,
    primitives: [trunk, root],
  });
  for (const t of [0.25 - 2e-9, 0.25, 0.75, 0.75 + 2e-9]) {
    const active = t >= 0.25 && t <= 0.75;
    TestValidator.equals(
      "closed writer interval",
      plan.posture(t, ["trunk"]).pitch,
      active ? 2 * (1 + t) : 0,
    );
  }
  rootReads = 0;
  trunkReads = 0;
  plan.posture(0.5, []);
  TestValidator.equals(
    "no work without demand",
    [rootReads, trunkReads],
    [0, 0],
  );
  TestValidator.predicate(
    "overlapping trunk authors refused",
    throwsError(() =>
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        primitives: [trunk, { ...trunk }],
      }),
    ),
  );
}

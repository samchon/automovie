import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanBase,
  composeAutoMovieMotionHumanAction,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Construct one action with two event names at the same physical instant.
 *
 * Scenarios:
 * 1. Two event names resolve to one quarter of the take and a third to three quarters.
 * 2. Only the explicitly requested optional contact appears on the plan.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents how coincident clock events are exposed and when the optional contact appears.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the composed action's public event shares and optional contact instant.
 * @evidence contracts/development/testing.md#independent-expectations A second in an action lasting four seconds is share one quarter, and the separate release at three seconds is share three quarters.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes coincident names, the clock's resolved seconds and an absent optional contact.
 * @evidence contracts/development/testing.md#execution-ownership One fixed posture and one clock, without any body solve.
 */
export function test_motion_catalogue_root_public_event_receipts(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(4, [
    { name: "release", seconds: 3 },
    { name: "depart", seconds: 1 },
    { name: "signal", seconds: 1 },
  ]);
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.still(
    4,
    posture,
  );
  const unmarked: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({ base, clock, primitives: [] });
  const marked: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [],
      contact: "signal",
    });
  TestValidator.equals(
    "both event identities appear at the same share",
    unmarked.events,
    [
      { name: "depart", share: 1 / 4 },
      { name: "signal", share: 1 / 4 },
      { name: "release", share: 3 / 4 },
    ],
  );
  TestValidator.predicate(
    "only the explicitly named optional contact becomes a receipt",
    marked.contact === 1 && unmarked.contact === undefined,
  );
}

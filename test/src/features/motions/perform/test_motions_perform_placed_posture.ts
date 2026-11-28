import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  readPlacedHumanPosture
} from "../../../../../packages/motions/src/perform/internal/readPlacedHumanPosture";
import { TestValidator } from "@nestia/e2e";

/**
 * A plan whose posture's root rises by a metre per plan second from `base`, so
 * the root's height names the local second read.
 */
function rising(
  duration: number,
  base: number,
): IAutoMovieMotionHumanActionPlan {
  return {
    duration,
    events: [],
    contacts: [],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => ({
      root: { x: 0, y: base + seconds, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    }),
  };
}

/**
 * `readPlacedHumanPosture` reads the last action entered by a film second at
 * its local second, held within its plan, and the person's initial posture
 * before any action.
 *
 * The person starts with the root at height 0; the first action enters at 1 s
 * and runs 1 s from a root at 10, the second enters at 2 s, starts at 2.25 s
 * (an entry blend before it) and runs 0.5 s from a root at 20.
 *
 * Scenarios:
 *
 * 1. Before any entry the initial posture is read.
 * 2. Within the first action its local second is read: 1.5 s reads 10.5.
 * 3. Between the second's entry and its start its first second is read: 20.
 * 4. Past the last action's end its final pose holds: 4 s reads 20.5.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The posture read uses initial state before entry, the selected plan clock, clamping before the delayed plan start and retention after the end.
 * @evidence contracts/development/testing.md#behavioral-verification Passes two typed placed actions and a distinct initial posture to `readPlacedHumanPosture`. The synthetic posture's root height encodes its local time for direct observation.
 * @evidence contracts/development/testing.md#independent-expectations Before entry the initial posture retains its identity. At film 1.5 s the first base 10 plus local 0.5 gives 10.5. At 2.1 s the entered second action has not started locally, so its height is 20. After the final 0.5 s motion it holds 20.5.
 */
export function test_motions_perform_placed_posture(): void {
  const initial: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const person: readPlacedHumanPosture.IPlaced = {
    initial,
    segments: [
      { entryTime: 1, start: 1, plan: rising(1, 10) },
      { entryTime: 2, start: 2.25, plan: rising(0.5, 20) },
    ],
  };
  const height = (seconds: number): number =>
    readPlacedHumanPosture(person, seconds).root.y;

  // 1. Before any entry.
  TestValidator.predicate(
    "the initial posture before any entry",
    readPlacedHumanPosture(person, 0.5) === initial,
  );

  // 2. Within the first action.
  TestValidator.equals("the first action's local second", height(1.5), 10.5);

  // 3. Before the second's start.
  TestValidator.equals("the second action's first second", height(2.1), 20);

  // 4. Past the end.
  TestValidator.equals("the final pose holds", height(4), 20.5);
}

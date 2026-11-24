import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanRoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { linearMotionClock } from "../../../internal/synthetic/linearMotionClock";
import { vclose } from "../../../internal/vclose";

/** Rounding of one product and one sum, degrees or metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.face` turns the heading by an angle on the clock's
 * progress over a window and holds the turn until the action's end, leaving the
 * root where it was.
 *
 * The clock is synthetic and linear (`linearMotionClock`), 2 s with `peak` at 1
 * s, so the progress from `start` to `peak` is the elapsed share of that
 * second.
 *
 * Scenarios:
 *
 * 1. The primitive runs from the window's first instant to the clock's end.
 * 2. A 45° turn from heading 90 reaches 112.5° halfway, 135° at the peak and holds
 *    135° at the end.
 * 3. The root never moves while turning.
 * 4. A turn of 0° keeps the entry heading throughout.
 */
export function test_unit_motions_compose_root_face(): void {
  const clock: IAutoMovieMotionClock = linearMotionClock(2, [
    { name: "peak", seconds: 1 },
  ]);
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: 3 },
    yaw: 90,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const turn: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanRoot.face(
    clock,
    ["start", "peak"],
    45,
  );
  const none: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanRoot.face(
    clock,
    ["start", "peak"],
    0,
  );

  TestValidator.equals(
    "runs from the window's start to the clock's end",
    [turn.from, turn.to],
    [0, 2],
  );
  for (const [t, yaw] of [
    [0, 90],
    [0.5, 112.5],
    [1, 135],
    [2, 135],
  ] as const) {
    const posed: IAutoMovieMotionHumanPosture = turn.write(entry, t);
    TestValidator.predicate(
      `at ${t} s the heading is ${yaw}° and the root stays`,
      nclose(posed.yaw, yaw, ROUNDING) &&
        vclose(posed.root, entry.root, ROUNDING),
    );
    TestValidator.predicate(
      `a turn of 0° keeps heading 90 at ${t} s`,
      nclose(none.write(entry, t).yaw, 90, ROUNDING),
    );
  }
}

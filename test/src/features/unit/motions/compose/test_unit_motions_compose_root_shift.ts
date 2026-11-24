import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanRoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { linearMotionClock } from "../../../internal/synthetic/linearMotionClock";
import { vclose } from "../../../internal/vclose";

/** Rounding of one rotation, one product and one sum per component, metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.shift` moves the root by a displacement in the
 * body's own floor frame on the clock's progress over a window, and holds it
 * there until the action's end.
 *
 * The clock is synthetic and linear (`linearMotionClock`), 2 s with `peak` at 1
 * s, so the progress from `start` to `peak` is the elapsed share of that
 * second. The entry faces heading 90, which carries local forward onto world
 * +X.
 *
 * Scenarios:
 *
 * 1. The primitive runs from the window's first instant to the clock's end.
 * 2. A half-metre forward shift moves the root along world +X by the progress
 *    share: none at 0 s, a quarter metre at 0.5 s, all of it at 1 s.
 * 3. After the window the root holds the whole shift (2 s).
 */
export function test_unit_motions_compose_root_shift(): void {
  const clock: IAutoMovieMotionClock = linearMotionClock(2, [
    { name: "peak", seconds: 1 },
  ]);
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.shift(clock, ["start", "peak"], {
      x: 0,
      y: 0,
      z: 0.5,
    });
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: 3 },
    yaw: 90,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };

  TestValidator.equals(
    "runs from the window's start to the clock's end",
    [primitive.from, primitive.to],
    [0, 2],
  );
  for (const [t, moved] of [
    [0, 0],
    [0.5, 0.25],
    [1, 0.5],
    [2, 0.5],
  ] as const)
    TestValidator.predicate(
      `at ${t} s the root is ${moved} m along world +X`,
      vclose(
        primitive.write(entry, t).root,
        { x: 2 + moved, y: 0, z: 3 },
        ROUNDING,
      ),
    );
}

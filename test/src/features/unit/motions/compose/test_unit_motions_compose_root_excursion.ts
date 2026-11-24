import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { AutoMovieMotionHumanRoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { linearMotionClock } from "../../../internal/synthetic/linearMotionClock";
import { vclose } from "../../../internal/vclose";

/** Rounding of one product and one sum per component, metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.excursion` displaces the root by the clock's
 * envelope share of a displacement, rising over one window and falling over a
 * later one, and writes the root from the rise's first instant to the fall's
 * last.
 *
 * The clock is synthetic and linear (`linearMotionClock`), 2 s with `peak` at 1
 * s, so the envelope of a rise from `start` to `peak` and a fall from `peak` to
 * `end` is a triangle: 0, 0.5, 1, 0.5 and 0 at 0, 0.5, 1, 1.5 and 2 s. The
 * displacement is a quarter-metre dip, so the expected root follows from the
 * triangle alone.
 *
 * Scenarios:
 *
 * 1. The primitive's window is the rise's start to the fall's end.
 * 2. The root dips by the envelope share of 0.25 m at each sample, the full dip at
 *    the peak, and rejoins the entry at both ends.
 * 3. A sample outside the windows (2.5 s) adds nothing.
 */
export function test_unit_motions_compose_root_excursion(): void {
  const clock: IAutoMovieMotionClock = linearMotionClock(2, [
    { name: "peak", seconds: 1 },
  ]);
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.excursion(
      clock,
      ["start", "peak"],
      ["peak", "end"],
      { point: { x: 0, y: -0.25, z: 0 }, yaw: 0 },
    );
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 0, z: 3 },
    yaw: 90,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };

  TestValidator.equals(
    "written from the rise's start to the fall's end",
    [primitive.from, primitive.to],
    [0, 2],
  );
  for (const [t, share] of [
    [0, 0],
    [0.5, 0.5],
    [1, 1],
    [1.5, 0.5],
    [2, 0],
    [2.5, 0],
  ] as const)
    TestValidator.predicate(
      `at ${t} s the root dips ${share} of a quarter metre`,
      vclose(
        primitive.write(entry, t).root,
        { x: 2, y: -0.25 * share, z: 3 },
        ROUNDING,
      ),
    );
}

import { compileAutoMovieFlameFlicker } from "@automovie/engine/internal";
import type { IAutoMovieFlameCue } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The bound intensity grid merges the exact envelope edges and its fixed clock.
 *
 * Scenarios:
 *
 * 1. Both switch edges precede the first 1/120 second tick. Only the opening edge
 *    is inside [start, end), so its own area equals the exact mean.
 * 2. Without a switch interval all fixed clock keys, including the shot tail,
 *    contribute to the mean.
 */
export function test_engine_film_compile_flame_flicker(): void {
  const cue: Pick<IAutoMovieFlameCue, "id" | "seed" | "size"> = {
    id: "lamp",
    seed: 7,
    size: { kind: "ember", radius: 0.125 },
  };
  const duration: number = 0.0125;
  const start: number = 1 / 480;
  const end: number = 3 / 480;
  const switched: ReturnType<typeof compileAutoMovieFlameFlicker> =
    compileAutoMovieFlameFlicker({ ...cue, on: { start, end } }, duration);
  TestValidator.equals(
    "clock includes the exact arbitrary boundaries",
    switched.times,
    [0, start, end, 1 / 120, duration],
  );
  TestValidator.equals("the closing edge is excluded", switched.inside, [
    false,
    true,
    false,
    false,
    false,
  ]);
  TestValidator.predicate(
    "one contained area determines the exact mean",
    switched.mean === switched.areas[1] && switched.mean > 0,
  );
  const open: ReturnType<typeof compileAutoMovieFlameFlicker> =
    compileAutoMovieFlameFlicker(cue, duration);
  TestValidator.equals(
    "every sample counts when no interval is authored",
    open.inside,
    [true, true, true],
  );
  TestValidator.predicate(
    "tail is sampled and all three areas contribute",
    open.times[2] === duration &&
      open.mean === (open.areas[0]! + open.areas[1]! + open.areas[2]!) / 3,
  );
}

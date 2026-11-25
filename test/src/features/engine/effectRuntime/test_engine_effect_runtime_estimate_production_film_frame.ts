import { estimateProductionFilmFrame } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `estimateProductionFilmFrame` is `round(seconds * numerator / denominator)`
 * floored at 0, or null once the frame leaves the safe-integer range.
 *
 * Scenarios:
 *
 * 1. 1.5 s at 24 fps is frame 36 under any rounding; 0.51 s at 30/1001 fps is 0.51
 *
 *    - 30 / 1001 = 0.01528..., which `floor` reads as 0 and `ceil` as 1.
 * 2. A negative time floors at frame 0.
 * 3. A time past 2^53 - 2 frames is null.
 */
export function test_engine_effect_runtime_estimate_production_film_frame(): void {
  const film: { numerator: number; denominator: number } = {
    numerator: 24,
    denominator: 1,
  };
  TestValidator.equals(
    "1.5 s at 24 fps",
    estimateProductionFilmFrame(1.5, film, Math.round),
    36,
  );
  const ntsc: { numerator: number; denominator: number } = {
    numerator: 30,
    denominator: 1001,
  };
  TestValidator.equals(
    "the rounding is the caller's",
    [
      estimateProductionFilmFrame(0.51, ntsc, Math.floor),
      estimateProductionFilmFrame(0.51, ntsc, Math.ceil),
    ],
    [0, 1],
  );
  TestValidator.equals(
    "a negative time floors at 0",
    estimateProductionFilmFrame(-3, film, Math.floor),
    0,
  );
  TestValidator.equals(
    "past the safe range",
    estimateProductionFilmFrame(Number.MAX_SAFE_INTEGER, film, Math.floor),
    null,
  );
}

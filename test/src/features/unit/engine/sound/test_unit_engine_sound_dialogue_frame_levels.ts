import { productionDialogueFrameLevels } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `productionDialogueFrameLevels` reads each frame's RMS level from the line's
 * own samples at the film's samples per frame.
 *
 * Clock: 24 fps at 48 kHz, so a frame is 2000 samples. Line: frames 10 and 11,
 * the first silent and the second a 1.2 kHz sine of amplitude 0.1 times the
 * square root of two (50 whole cycles per frame, RMS 0.1).
 *
 * Scenarios:
 *
 * 1. Two frames give two levels: 0 for the silent frame and 0.1 within 1e-6 for
 *    the sine.
 */
export function test_unit_engine_sound_dialogue_frame_levels(): void {
  const samples: Float32Array = Float32Array.from(
    { length: 4000 },
    (_: unknown, index: number): number =>
      index < 2000
        ? 0
        : 0.1 * Math.SQRT2 * Math.sin((2 * Math.PI * 1200 * index) / 48_000),
  );
  const levels: Float64Array = productionDialogueFrameLevels(
    { fps: 24, sampleRate: 48_000 },
    { startFrame: 10, endFrame: 12 },
    samples,
  );
  TestValidator.equals("two frames", levels.length, 2);
  TestValidator.equals("silent frame", levels[0], 0);
  TestValidator.predicate("sine frame", Math.abs(levels[1]! - 0.1) <= 1e-6);
}

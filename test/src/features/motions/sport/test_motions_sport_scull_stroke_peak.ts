import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { precisionStrokePeak } from "../../../../../packages/motions/src/lexicon/internal/precisionStrokePeak";

/**
 * Sample both rowing wrists once per instant, including the shortened final
 * step.
 *
 * Scenarios:
 *
 * 1. An interval of two and a half steps reads the two wrists together at
 *    each of the three grid points and the clipped endpoint.
 * 2. The wrist moving at 8 m/s in the final half-step sets the peak over
 *    the other wrist's 2 m/s. Swap left and right and keep the same peak.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases give the sample count, clipped clock and speed outcome when each side leads.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the paired stroke sampler and records each time it requests both wrist points.
 * @evidence contracts/development/testing.md#independent-expectations The expected sample list is the 240 Hz grid plus the clipped end. The wrist paths have known piecewise speeds, with the faster wrist's peak in the final half-step.
 */
export function test_motions_sport_scull_stroke_peak(): void {
  const step: number = 1 / 240;
  const end: number = 2.5 * step;
  for (const lead of ["left", "right"] as const) {
    const sampled: number[] = [];
    const speed: number = precisionStrokePeak.paired(end, (at) => {
      sampled.push(at);
      const regular: IAutoMovieVector3 = { x: 2 * at, y: 0, z: 0 };
      const finishing: IAutoMovieVector3 = {
        x: 0,
        y: Math.max(0, at - 2 * step) * 8,
        z: 0,
      };
      return lead === "left" ? [finishing, regular] : [regular, finishing];
    });
    TestValidator.equals(`${lead}: once at each sample`, sampled, [
      0,
      step,
      2 * step,
      end,
    ]);
    TestValidator.equals(`${lead}: final half step`, speed, 8);
  }
}

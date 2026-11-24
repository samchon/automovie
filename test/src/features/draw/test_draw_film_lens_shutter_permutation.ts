import { planAutoMovieFilmSamples } from "@automovie/engine";
import type {
  IAutoMovieFilmOptics,
  IAutoMoviePlanFilmSamples,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * With both a shutter and a lens, a frame's samples take the lens points in a
 * fixed order other than their time order, so time and aperture position are
 * not correlated.
 *
 * Scenarios:
 *
 * 1. For 2, 7, 16 and 64 samples with both members, the lens point indices are a
 *    permutation of 0 … N − 1 that differs from the identity, and planning
 *    again gives the same order.
 * 2. With a lens alone the indices are 0 … N − 1 in order; with a shutter alone
 *    every sample has no lens point.
 * 3. Every eye offset lies within the aperture radius 12 mm / tan(fovY / 2) /
 *    fNumber / 2.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the planner's point indices and eye offsets; an identity order under both members, a duplicated index or an eye outside the aperture fails.
 * @evidence contracts/development/testing.md#independent-expectations The permutation and identity requirements are the issue's; the aperture radius is the issue's lens geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases The smallest count, a prime count, powers of two, and each member alone. Projection of the offsets belongs to test_draw_film_lens_blur.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test discovered by its export name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios with the counts and expected orders.
 */
export function test_draw_film_lens_shutter_permutation(): void {
  const lens: IAutoMovieFilmOptics.ILens = { fNumber: 2.8, focusDistance: 3 };
  const plan: (
    samples: number,
    members: Partial<IAutoMovieFilmOptics>,
  ) => IAutoMoviePlanFilmSamples.ISample[] = (
    samples: number,
    members: Partial<IAutoMovieFilmOptics>,
  ): IAutoMoviePlanFilmSamples.ISample[] =>
    planAutoMovieFilmSamples({
      seconds: 2,
      fps: 24,
      fovY: 40,
      optics: { ev100: 10, toneMapping: "none", samples, ...members },
    });
  const points: (
    samples: IAutoMoviePlanFilmSamples.ISample[],
  ) => (number | null)[] = (
    samples: IAutoMoviePlanFilmSamples.ISample[],
  ): (number | null)[] =>
    samples.map(
      (sample: IAutoMoviePlanFilmSamples.ISample): number | null =>
        sample.point,
    );

  for (const count of [2, 7, 16, 64]) {
    const both: (number | null)[] = points(
      plan(count, { shutter: { angle: 180 }, lens }),
    );
    const identity: number[] = Array.from(
      { length: count },
      (_: unknown, index: number): number => index,
    );
    TestValidator.predicate(
      `${count} samples take a fixed permutation other than the identity`,
      [...both]
        .sort((a: number | null, b: number | null): number => a! - b!)
        .join() === identity.join() &&
        both.join() !== identity.join() &&
        both.join() ===
          points(plan(count, { shutter: { angle: 180 }, lens })).join(),
    );
    TestValidator.equals(
      `${count} samples of a lens alone take the identity`,
      points(plan(count, { lens })),
      identity,
    );
    TestValidator.predicate(
      `${count} samples of a shutter alone take no lens point`,
      plan(count, { shutter: { angle: 180 } }).every(
        (sample: IAutoMoviePlanFilmSamples.ISample): boolean =>
          sample.point === null && sample.eye === null,
      ),
    );
  }

  const radius: number = 0.012 / Math.tan((20 * Math.PI) / 180) / 2.8 / 2;
  TestValidator.predicate(
    "every eye lies on the aperture",
    plan(64, { lens }).every(
      (sample: IAutoMoviePlanFilmSamples.ISample): boolean =>
        sample.eye !== null &&
        Math.hypot(sample.eye.x, sample.eye.y) <= radius * (1 + 1e-12),
    ),
  );
}

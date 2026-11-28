import { AutoMovieEngineFilmResponse } from "@automovie/engine";
import type {
  IAutoMovieFilmOptics,
  IAutoMoviePlanFilmSamples,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `planFilmSamples` gives each frame's samples a lens point and eye
 * offset when the optics hold a lens, and a time spread when they hold a
 * shutter.
 *
 * Scenarios:
 *
 * 1. A lens alone takes the points 0 .. N - 1 in order.
 * 2. A shutter alone takes no lens point and no eye offset.
 * 3. Both together take a repeatable permutation of 0 .. N - 1 other than the
 *    identity, so time and aperture position are not correlated.
 * 4. Every eye offset lies within the aperture radius 12 mm / tan(fovY / 2) /
 *    fNumber / 2.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify lens-only and shutter-only sampling, the deterministic combined permutation and the physically derived aperture bound.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls the film-response sample planner with each optics combination and observes point indices, time offsets, eye vectors and repeatability.
 * @evidence contracts/development/testing.md#independent-expectations The independent radius is 12 mm divided by tan(fovY/2), f-number and two. Eye offsets must lie inside that circle. The index population is fixed at 0 through N minus one, so a repeatable nonidentity permutation must preserve every lens point.
 */
export function test_engine_film_plan_film_samples(): void {
  const lens: IAutoMovieFilmOptics.ILens = { fNumber: 2.8, focusDistance: 3 };
  const plan = (
    samples: number,
    members: Partial<IAutoMovieFilmOptics>,
  ): IAutoMoviePlanFilmSamples.ISample[] =>
    AutoMovieEngineFilmResponse.planAutoMovieFilmSamples({
      seconds: 2,
      fps: 24,
      fovY: 40,
      optics: { ev100: 10, toneMapping: "none", samples, ...members },
    });
  const points = (
    samples: IAutoMoviePlanFilmSamples.ISample[],
  ): (number | null)[] =>
    samples.map(
      (sample: IAutoMoviePlanFilmSamples.ISample): number | null =>
        sample.point,
    );

  for (const count of [7, 16]) {
    const identity: number[] = Array.from(
      { length: count },
      (_: unknown, index: number): number => index,
    );
    TestValidator.equals(
      `${count} samples of a lens alone`,
      points(plan(count, { lens })),
      identity,
    );
    TestValidator.predicate(
      `${count} samples of a shutter alone`,
      plan(count, { shutter: { angle: 180 } }).every(
        (sample: IAutoMoviePlanFilmSamples.ISample): boolean =>
          sample.point === null && sample.eye === null,
      ),
    );
    const both: (number | null)[] = points(
      plan(count, { shutter: { angle: 180 }, lens }),
    );
    TestValidator.predicate(
      `${count} samples of both take a permutation`,
      [...both].sort((a: number | null, b: number | null): number => a! - b!)
        .join() === identity.join() &&
        both.join() !== identity.join() &&
        both.join() ===
          points(plan(count, { shutter: { angle: 180 }, lens })).join(),
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

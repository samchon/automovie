import {
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeSea,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Allows floating-point arithmetic in ratios and their square roots. */
const SPECTRUM_ROUNDING: number = 128 * Number.EPSILON;

/**
 * The discrete deep-water spectrum retains its similarity and variance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines spectral similarity, physical dispersion, variance, periodic bearing and invalid height boundaries.
 * @evidence contracts/development/testing.md#behavioral-verification Builds sea fields at ordinary and extreme heights and checks actual component frequency, wavenumber, amplitude and phase. Reads directional samples and the two structured height refusals.
 * @evidence contracts/development/testing.md#independent-expectations Deep-water dispersion requires `2*pi*f = sqrt(g*k)`. Fourier variance is the sum of squared amplitudes divided by two, and four times its square root gives the significant height within the authored quadrature tolerance.
 */
export function test_archetypes_core_sea_spectrum(): void {
  const reference = AutoMovieArchetypeSea.of({ height: 1, seed: 24 });
  for (const height of [1e-180, 1e180]) {
    const sea = AutoMovieArchetypeSea.of({ height, seed: 24 });
    TestValidator.predicate(
      "the spectrum retains all positive frequency bands",
      sea.components.length === reference.components.length &&
        sea.components.length > 0 &&
        sea.components.every((part, index) => {
          const baseline = reference.components[index]!;
          return (
            nclose(
              (part.frequency * Math.sqrt(height)) / baseline.frequency,
              1,
              SPECTRUM_ROUNDING,
            ) &&
            nclose(
              (part.wavenumber * height) / baseline.wavenumber,
              1,
              SPECTRUM_ROUNDING,
            ) &&
            nclose(
              part.amplitude / height / baseline.amplitude,
              1,
              SPECTRUM_ROUNDING,
            ) &&
            nclose(
              Math.sqrt(9.80665 * part.wavenumber) /
                (2 * Math.PI * part.frequency),
              1,
              SPECTRUM_ROUNDING,
            ) &&
            part.phase === baseline.phase
          );
        }),
    );
    // Independent Fourier variance gives Hm0 = 4 sqrt(sum(A^2 / 2)).
    const normalized = sea.components.map(
      ({ amplitude }) => amplitude / height,
    );
    TestValidator.predicate(
      "the band-limited quadrature reproduces significant wave height",
      nclose((4 * Math.hypot(...normalized)) / Math.SQRT2, 1, 0.02),
    );
  }

  const bearing = AutoMovieArchetypeSea.of({
    height: 2,
    heading: 90,
    seed: 24,
  });
  const wrapped = AutoMovieArchetypeSea.of({
    height: 2,
    heading: 450,
    seed: 24,
  });
  TestValidator.predicate(
    "a full-turn bearing change preserves both the elevation and directional slope",
    nclose(
      wrapped.elevation(2, -3, 1),
      bearing.elevation(2, 9, 1),
      SPECTRUM_ROUNDING,
    ) &&
      nclose(
        wrapped.slope(2, -3, 1).x,
        bearing.slope(2, 9, 1).x,
        SPECTRUM_ROUNDING,
      ) &&
      nclose(wrapped.slope(2, -3, 1).z, 0, SPECTRUM_ROUNDING),
  );
  for (const height of [Number.MIN_VALUE, Number.MAX_VALUE]) {
    let refusal: unknown;
    try {
      AutoMovieArchetypeSea.of({ height, seed: 24 });
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      "unrepresentable spectral components refuse the height",
      refusal instanceof AutoMovieArchetypeRefusal &&
        refusal.axis === "height" &&
        refusal.value === height,
    );
  }
}

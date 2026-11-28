import { AutoMovieEngineCurve } from "@automovie/engine";
import type { IAutoMovieGenerateSupportCurve64 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Support curves admit finite harmonics, an exact bounded power-of-two
 * partition and finite convex curve qualifications.
 *
 * Independent circle and translated harmonic controls verify the public
 * millimetre and phase conventions. A large finite circle retains both its
 * perimeter and approximation estimate. Fractional and nonfinite partitions and
 * coefficients, unresolved curvature and infinite perimeter throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the exact partitions, circle and harmonic outputs, finite large radius and independent refusal branches.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public support generator and reads endpoint and handle coordinates, turn intervals and emitted measures. Checks actual diagnostic text for malformed input and nonfinite output arithmetic.
 * @evidence contracts/development/testing.md#independent-expectations A constant support radius has perimeter 2*pi*r and its derivative vanishes. A first harmonic translates the curve, and the small second harmonic has a minimum radius of 8.5 mm before its known angular remainder. The same analytic perimeter and Hermite estimate scale linearly with a larger circle.
 */
export function test_engine_geometry_support_curve_admission(): void {
  const generate = AutoMovieEngineCurve.generateSupportCurve64;
  const ring: IAutoMovieGenerateSupportCurve64.IProps = {
    name: "ring",
    harmonics: [{ cosine: 10, sine: 0 }],
    spans: 4,
  };
  const fit = generate(ring);
  TestValidator.equals(
    "closed millimetre curve at quarter-turn phases",
    [
      fit.curve.unit,
      fit.curve.phaseUnit,
      fit.curve.closed,
      fit.curve.phaseIntervals,
      fit.curve.spans[0]?.[0],
      fit.curve.spans[3]?.[3],
    ],
    ["mm", "turn", true, [0.25, 0.25, 0.25, 0.25], [10, 0, 0], [10, 0, 0]],
  );
  const estimateFactor = (Math.SQRT2 * (Math.PI / 2) ** 4) / 384;
  TestValidator.predicate(
    "circle perimeter, radius, Hermite estimate and tangent",
    Math.abs(fit.analyticPerimeter - 20 * Math.PI) <= 1e-12 &&
      fit.minimumRadiusLowerEstimate === 10 &&
      Math.abs(fit.approximationErrorEstimate - 10 * estimateFactor) <= 1e-12 &&
      Math.abs(fit.curve.spans[0]![1][2] - (5 * Math.PI) / 3) <= 1e-12,
  );
  const harmonic = generate({
    ...ring,
    harmonics: [
      { cosine: 10, sine: 0 },
      { cosine: 3, sine: -4 },
      { cosine: 0.5, sine: 0 },
    ],
  });
  TestValidator.equals(
    "translated harmonic endpoint",
    harmonic.curve.spans[0]?.[0],
    [13.5, 0, -4],
  );
  TestValidator.predicate(
    "curvature margin and derivative estimate",
    Math.abs(
      harmonic.minimumRadiusLowerEstimate - (8.5 - (3 * Math.PI) / 16),
    ) <= 1e-12 &&
      Math.abs(harmonic.approximationErrorEstimate - 31 * estimateFactor) <=
        1e-12,
  );
  const huge: number = 2.5e307;
  const large = generate({ ...ring, harmonics: [{ cosine: huge, sine: 0 }] });
  TestValidator.predicate(
    "representable large-circle coefficients",
    Math.abs(large.analyticPerimeter / huge - 2 * Math.PI) <= 1e-12 &&
      Math.abs(large.approximationErrorEstimate / huge - estimateFactor) <=
        1e-12 &&
      large.minimumRadiusLowerEstimate === huge &&
      large.curve.spans.every((span) =>
        span.every((point) => point.every(Number.isFinite)),
      ),
  );
  const invalid: [string, IAutoMovieGenerateSupportCurve64.IProps, string][] = [
    ...[NaN, 4.5, 6, Infinity].map(
      (spans): [string, IAutoMovieGenerateSupportCurve64.IProps, string] => [
        String(spans),
        { ...ring, spans },
        "bounded power-of-two partition",
      ],
    ),
    [
      "NaN coefficient",
      { ...ring, harmonics: [{ cosine: NaN, sine: 0 }] },
      "coefficient pairs must be finite",
    ],
    [
      "sparse coefficients",
      { ...ring, harmonics: new Array(1) },
      "coefficient pairs must be finite",
    ],
    [
      "unresolved positive curvature",
      {
        ...ring,
        harmonics: [
          { cosine: 10, sine: 0 },
          { cosine: 0, sine: 0 },
          { cosine: 5, sine: 0 },
        ],
      },
      "Positive curvature radius remains unresolved",
    ],
    [
      "unrepresentable perimeter",
      { ...ring, harmonics: [{ cosine: 4e307, sine: 0 }] },
      "qualifications must remain finite",
    ],
  ];
  TestValidator.equals(
    "declared and computed boundary failures",
    invalid
      .filter(
        ([, input, message]) => !throwsError(() => generate(input), message),
      )
      .map(([name]) => name),
    [],
  );
}

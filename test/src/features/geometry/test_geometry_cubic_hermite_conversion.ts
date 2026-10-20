import { TestValidator } from "@nestia/e2e";

import { AutoMovieCurveMath64 as M } from "../../../../packages/engine/src/geometry/curve/AutoMovieCurveMath64";
import { nclose } from "../internal/nclose";

/**
 * Cubic Bernstein and endpoint Hermite data express the same physical chart.
 *
 * Scenarios:
 * 1. Asymmetric three-dimensional polynomial values and physical derivatives survive conversion at unit and nonunit widths on shifted intervals.
 * 2. Reversed nets, zero endpoint derivatives, constant cubics and equal-endpoint loops retain their derivative magnitudes and signs.
 * 3. Returned vectors do not alias either endpoint or the input, even when original controls alias.
 * 4. Invalid widths, noncubic controls, overflow and nonzero underflow refuse; finite scaled differences and tiny-width constants remain valid.
 * 5. Existing derivative arithmetic retains signed widths, extrapolation, ignored extra controls and nonfinite results; conversion alone has stricter admission.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes both public conversions and the existing cubic evaluator/derivative consumer; assertions compare endpoints, physical first derivatives, interior values, round-trip controls and ownership.
 * @evidence contracts/testing.md#independent-expectations The fixed polynomial is(1+3t-2t²+t³,-2+4t²-3t³,4-6t+3t²+2t³). Its known power coefficients independently determine values and derivatives; explicit Hermite basis polynomials reconstruct the same curve using dy-scaled endpoint jets.
 * @evidence contracts/testing.md#distinguishing-cases Widths 1, 2 and .125 and shifted origins distinguish chart derivatives from unit tangents. Reversal, stationary endpoints, a nonconstant closed loop, shared input arrays, minimal widths, inactive overflow terms, overflow and quartic rejection distinguish ownership, sign, scale, finite arithmetic and degree admission. Existing signed and nonfinite derivative behavior is checked independently of conversion admission.
 * @evidence contracts/testing.md#execution-ownership Portable generic cubic arithmetic runs in process without an asset, Human fixture, source mesh, filesystem, viewer, browser, renderer or GPU.
 */
export function test_geometry_cubic_hermite_conversion(): void {
  const span: M.Span = [
    [1, -2, 4],
    [2, -2, 2],
    [7 / 3, -2 / 3, 1],
    [3, -1, 3],
  ];
  const before: string = JSON.stringify(span);
  const close: (
    actual: readonly number[],
    expected: readonly number[],
    tolerance?: number,
  ) => boolean = (
    actual: readonly number[],
    expected: readonly number[],
    tolerance: number = 1e-12,
  ): boolean =>
    actual.length === expected.length &&
    actual.every((value: number, i: number): boolean =>
      nclose(value, expected[i]!, tolerance),
    );
  const power: (t: number) => M.V = (t: number): M.V => [
    1 + 3 * t - 2 * t ** 2 + t ** 3,
    -2 + 4 * t ** 2 - 3 * t ** 3,
    4 - 6 * t + 3 * t ** 2 + 2 * t ** 3,
  ];
  const slope: (t: number, width: number) => M.V = (
    t: number,
    width: number,
  ): M.V => [
    (3 - 4 * t + 3 * t ** 2) / width,
    (8 * t - 9 * t ** 2) / width,
    (-6 + 6 * t + 6 * t ** 2) / width,
  ];
  for (const width of [1, 2, 0.125])
    for (const origin of [0, -3.75]) {
      const jets: ReturnType<typeof M.toHermite> = M.toHermite(span, width);
      TestValidator.predicate(
        "endpoint positions and physical derivatives",
        close(jets.start, [1, -2, 4]) &&
          close(jets.end, [3, -1, 3]) &&
          close(jets.startDerivative, [3 / width, 0, -6 / width]) &&
          close(jets.endDerivative, [2 / width, -1 / width, 6 / width]),
      );
      const restored: M.Span = M.hermite(
        jets.start,
        jets.end,
        jets.startDerivative,
        jets.endDerivative,
        width,
      );
      TestValidator.predicate(
        "cubic control round trip",
        restored.every((point: M.V, i: number): boolean =>
          close(point, span[i]!),
        ),
      );
      for (const fraction of [0, 0.125, 0.4, 0.75, 1]) {
        const parameter: number = origin + width * fraction,
          t: number = (parameter - origin) / width;
        const basis: number[] = [
          2 * t ** 3 - 3 * t ** 2 + 1,
          -2 * t ** 3 + 3 * t ** 2,
          t ** 3 - 2 * t ** 2 + t,
          t ** 3 - t ** 2,
        ];
        const hermite: number[] = [0, 1, 2].map(
          (axis: number): number =>
            basis[0]! * jets.start[axis]! +
            basis[1]! * jets.end[axis]! +
            width *
              (basis[2]! * jets.startDerivative[axis]! +
                basis[3]! * jets.endDerivative[axis]!),
        );
        TestValidator.predicate(
          "independent Hermite basis and power polynomial",
          close(hermite, power(t)) &&
            close(M.cubic(restored, t), power(t)) &&
            close(M.derivative(restored, t, width), slope(t, width)),
        );
      }
      const reversed: ReturnType<typeof M.toHermite> = M.toHermite(
        [...span].reverse(),
        width,
      );
      TestValidator.predicate(
        "reversal preserves positions and changes derivative orientation",
        close(reversed.start, jets.end) &&
          close(reversed.end, jets.start) &&
          close(
            reversed.startDerivative,
            jets.endDerivative.map((value: number): number => -value),
          ) &&
          close(
            reversed.endDerivative,
            jets.startDerivative.map((value: number): number => -value),
          ),
      );
    }
  const constant: M.V = [4, -3, 2];
  const stationary: ReturnType<typeof M.toHermite> = M.toHermite(
    [constant, constant, constant, constant],
    Number.MIN_VALUE,
  );
  TestValidator.predicate(
    "tiny-width constant has exact zero derivatives",
    close(stationary.startDerivative, [0, 0, 0], 0) &&
      close(stationary.endDerivative, [0, 0, 0], 0),
  );
  TestValidator.predicate(
    "all returned vectors have independent ownership",
    stationary.start !== constant &&
      stationary.end !== constant &&
      stationary.start !== stationary.end &&
      stationary.startDerivative !== stationary.endDerivative,
  );
  stationary.start[0] = 99;
  TestValidator.predicate(
    "mutating output cannot mutate source or other endpoint",
    close(constant, [4, -3, 2], 0) && close(stationary.end, [4, -3, 2], 0),
  );
  const oneSided: ReturnType<typeof M.toHermite> = M.toHermite(
    [
      [0, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ],
    2,
  );
  TestValidator.predicate(
    "both stationary endpoints are legal",
    close(oneSided.startDerivative, [0, 0, 0], 0) &&
      close(oneSided.endDerivative, [0, 0, 0], 0),
  );
  const loop: ReturnType<typeof M.toHermite> = M.toHermite(
    [
      [0, 0, 0],
      [2, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    2,
  );
  TestValidator.predicate(
    "equal endpoints do not collapse a cubic loop",
    close(loop.startDerivative, [3, 0, 0]) &&
      close(loop.endDerivative, [0, -1.5, 0]),
  );
  const extreme: ReturnType<typeof M.toHermite> = M.toHermite(
    [
      [-1e308, 0, 0],
      [1e308, 0, 0],
      [-1e308, 0, 0],
      [1e308, 0, 0],
    ],
    1e308,
  );
  TestValidator.predicate(
    "scaled finite endpoint differences avoid intermediate overflow",
    close(extreme.startDerivative, [6, 0, 0]) &&
      close(extreme.endDerivative, [6, 0, 0]),
  );
  TestValidator.predicate(
    "existing signed endpoint derivative retains its width convention",
    close(M.derivative(span, 0, -2), [-1.5, 0, 3]),
  );
  for (const t of [-0.5, 0, 1, 1.5])
    TestValidator.predicate(
      "existing signed extrapolation uses its original polynomial",
      close(M.derivative(span, t, -2), slope(t, -2)),
    );
  TestValidator.predicate(
    "existing nonfinite widths retain numeric results rather than new guards",
    M.derivative(span, 0, Number.NaN).every(Number.isNaN) &&
      M.derivative(span, 1, Number.POSITIVE_INFINITY).every(
        (value: number): boolean => value === 0,
      ),
  );
  TestValidator.predicate(
    "existing derivative ignores controls after its cubic",
    close(M.derivative([...span, [9, 8, 7]], 1, 2), slope(1, 2)),
  );
  const inactiveOverflow: M.Span = [
    [0, 0, 0],
    [1, 0, 0],
    [-1e308, 0, 0],
    [1e308, 0, 0],
  ];
  const finiteEndpoints: ReturnType<typeof M.toHermite> = M.toHermite(
    inactiveOverflow,
    1e308,
  );
  TestValidator.predicate(
    "conversion resolves inactive overflow without changing old evaluation",
    Number.isNaN(M.derivative(inactiveOverflow, 0, 1e308)[0]) &&
      finiteEndpoints.startDerivative[0] > 0 &&
      nclose(finiteEndpoints.startDerivative[0] / 1e-308, 3, 1e-14) &&
      close(finiteEndpoints.endDerivative, [6, 0, 0]),
  );
  for (const width of [0, -1, Number.NaN, Number.POSITIVE_INFINITY])
    TestValidator.error("invalid chart width refuses", (): void => {
      M.toHermite(span, width);
    });
  TestValidator.error(
    "quartic endpoint jets do not determine its interior",
    (): void => {
      M.toHermite(
        [
          [0, 0, 0],
          [0, 0, 0],
          [1 / 6, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        1,
      );
    },
  );
  TestValidator.error("nonfinite controls refuse", (): void => {
    M.toHermite(
      [
        [0, 0, 0],
        [Number.NaN, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      1,
    );
  });
  TestValidator.error("each control has exactly three components", (): void => {
    M.toHermite(
      [
        [0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      1,
    );
  });
  const sparse: number[] = new Array<number>(3);
  TestValidator.error(
    "sparse controls do not silently become finite",
    (): void => {
      M.toHermite([sparse, [0, 0, 0], [0, 0, 0], [0, 0, 0]], 1);
    },
  );
  TestValidator.error(
    "unrepresentable derivative overflow refuses",
    (): void => {
      M.toHermite(
        [
          [0, 0, 0],
          [1, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        Number.MIN_VALUE,
      );
    },
  );
  TestValidator.error(
    "nonzero endpoint derivative cannot underflow silently",
    (): void => {
      M.toHermite(
        [
          [0, 0, 0],
          [Number.MIN_VALUE, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        Number.MAX_VALUE,
      );
    },
  );
  TestValidator.equals(
    "source coefficients remain unchanged",
    JSON.stringify(span),
    before,
  );
}

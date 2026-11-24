import {
  AutoMovieViewOutline,
  measureAutoMovieCubicCurveLength64,
  measureAutoMovieCurveLength64,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieViewOutline,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** One original derivative and its own closed parameter chart. */
type Piece = Parameters<typeof measureAutoMovieCurveLength64>[0][number];

/**
 * Original world derivatives supply physical curve lengths without a fitted
 * curve.
 *
 * Scenarios:
 *
 * 1. Lines, helices, a parabola with its asinh antiderivative and a
 *    three-dimensional quintic Pythagorean-hodograph curve have independent
 *    lengths. Unequal pieces, reversed parameters, world reflections and three
 *    length units retain them.
 * 2. Actual natural/quintic Outline station jets measure a folded-back source and
 *    a monotone named-height course with nonzero axis drift. Original prepared
 *    records remain unchanged; finite zero speed is allowed.
 * 3. Original cubic Bernstein controls retain local-parameter length despite
 *    unequal phase widths; the shared API and wrapper both meet the analytic
 *    13/3 mm length. Legacy finite-final returns also retain subnormal rounding
 *    and finite quadrature of a curve with endpoint-only speed overflow, while
 *    strict source admission still refuses them.
 * 4. Closed-domain queries and the declared finite evaluation budget are observed.
 *    Invalid domains/subdivisions, nonfinite endpoint/interior derivatives,
 *    unrepresentable widths/nodes/contributions and callback exceptions fail
 *    explicitly.
 */
export function test_unit_engine_geometry_geometry_source_curve_length(): void {
  const failures: string[] = [];

  // Exact physical norms distinguish chart scaling from coordinate scaling.
  for (const scale of [0.001, 1, 1000])
    for (const sign of [-1, 1]) {
      const line: Piece[] = [
        [-2, 0.3],
        [0.3, 4],
      ].map(
        (domain: number[]): Piece => ({
          domain: [domain[0]!, domain[1]!],
          derivative: (): Readonly<AutoMovieVector3Tuple> => [
            3 * sign * scale,
            4 * scale,
            12 * scale,
          ],
        }),
      );
      near(
        failures,
        "line units/sign",
        measureAutoMovieCurveLength64(line, 3).lengthMm,
        78 * scale,
        2e-12 * scale,
      );
      const helix: Piece = {
        domain: [-0.7, 1.2],
        derivative: (t: number): Readonly<AutoMovieVector3Tuple> => [
          2 * scale * 1.7 * Math.cos(1.7 * t),
          -3 * scale,
          -sign * 2 * scale * 1.7 * Math.sin(1.7 * t),
        ],
      };
      near(
        failures,
        "helix reflection",
        measureAutoMovieCurveLength64([helix], 2).lengthMm,
        1.9 * Math.hypot(3, 3.4) * scale,
        2e-12 * scale,
      );
      const quintic: Piece[] = [
        [5, 5.3],
        [5.3, 7],
        [7, 8],
      ].map(
        (domain: number[]): Piece => ({
          domain: [domain[0]!, domain[1]!],
          derivative: (p: number): Readonly<AutoMovieVector3Tuple> => {
            const t: number = sign > 0 ? (p - 5) / 3 : (8 - p) / 3;
            return [
              (sign * scale * (1 - t * t - t ** 4)) / 3,
              (sign * scale * 2 * t) / 3,
              (sign * scale * 2 * t * t) / 3,
            ];
          },
        }),
      );
      near(
        failures,
        "quintic PH nonuniform/reversed",
        measureAutoMovieCurveLength64(quintic, 3).lengthMm,
        (23 * scale) / 15,
        3e-12 * scale,
      );
    }
  const parabola: Piece[] = [
    [0, 0.2],
    [0.2, 1.9],
    [1.9, 3],
  ].map(
    (domain: number[]): Piece => ({
      domain: [domain[0]!, domain[1]!],
      derivative: (t: number): Readonly<AutoMovieVector3Tuple> => [1, 2 * t, 0],
    }),
  );
  const parabolaLength: number = 1.5 * Math.sqrt(37) + Math.asinh(6) / 4;
  for (const count of [4, 8]) {
    const measured: ReturnType<typeof measureAutoMovieCurveLength64> =
      measureAutoMovieCurveLength64(parabola, count);
    near(
      failures,
      "parabola exact antiderivative",
      measured.lengthMm,
      parabolaLength,
      2e-11,
    );
    check(
      failures,
      "observed difference is finite nonnegative",
      measured.differenceMm >= 0,
    );
  }

  // These are the original public source jets, including a named-height chain rule.
  const natural:
    | IAutoMovieViewOutline.IOutline
    | IAutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({
    knots: [
      { site: "start", station: 0, value: 0 },
      { site: "turn", station: 1, value: 1 },
      { site: "end", station: 2, value: 0 },
    ],
  });
  if ("detail" in natural) failures.push(natural.detail);
  else {
    const before: string = JSON.stringify(natural);
    const pieces: Piece[] = [
      [0, 1],
      [1, 2],
    ].map(
      (domain: number[]): Piece => ({
        domain: [domain[0]!, domain[1]!],
        derivative: (t: number): Readonly<AutoMovieVector3Tuple> => {
          const r: IAutoMovieViewOutline.IReading | string =
            AutoMovieViewOutline.at(natural, t);
          if (typeof r === "string" || r.stationJet === null)
            throw new Error("Unavailable original natural derivative");
          return [
            2 * r.stationJet[0],
            -3 * r.stationJet[0],
            6 * r.stationJet[0],
          ];
        },
      }),
    );
    near(
      failures,
      "natural source total variation",
      measureAutoMovieCurveLength64(pieces).lengthMm,
      14,
      2e-12,
    );
    check(
      failures,
      "original natural source unchanged",
      JSON.stringify(natural) === before,
    );
  }
  const height:
    | IAutoMovieViewOutline.IOutline
    | IAutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({
    knots: [
      {
        site: "height start",
        station: 0,
        value: 0,
        jet: { first: 0, second: 0 },
      },
      {
        site: "height end",
        station: 1,
        value: 1,
        jet: { first: 0, second: 0 },
      },
    ],
  });
  const axis: IAutoMovieViewOutline.IOutline | IAutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      knots: [
        { site: "axis start", station: 0, value: 0 },
        { site: "axis end", station: 1, value: 2 },
      ],
    });
  if ("detail" in height || "detail" in axis)
    failures.push("named-height source preparation failed");
  else {
    const before: string = JSON.stringify([height, axis]);
    const course: Piece = {
      domain: [0, 1],
      derivative: (t: number): Readonly<AutoMovieVector3Tuple> => {
        const y: IAutoMovieViewOutline.IReading | string =
          AutoMovieViewOutline.at(height, t);
        if (typeof y === "string" || y.stationJet === null)
          throw new Error("Unavailable named-height derivative");
        const x: IAutoMovieViewOutline.IReading | string =
          AutoMovieViewOutline.at(axis, y.value);
        if (typeof x === "string" || x.stationJet === null)
          throw new Error("Unavailable axis derivative");
        return [x.stationJet[0] * y.stationJet[0], y.stationJet[0], 0];
      },
    };
    near(
      failures,
      "named-height original axis drift",
      measureAutoMovieCurveLength64([course], 3).lengthMm,
      Math.sqrt(5),
      2e-12,
    );
    check(
      failures,
      "height/axis source unchanged",
      JSON.stringify([height, axis]) === before,
    );
  }
  const zero: ReturnType<typeof measureAutoMovieCurveLength64> =
    measureAutoMovieCurveLength64([
      {
        domain: [-1, 1],
        derivative: (): Readonly<AutoMovieVector3Tuple> => [0, 0, 0],
      },
    ]);
  near(failures, "finite zero-speed length", zero.lengthMm, 0, 0);
  near(failures, "finite zero-speed difference", zero.differenceMm, 0, 0);

  // Bernstein PH speed is1+t²; the second span is a3mm line in a different chart width.
  const cubic: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "original PH and line",
    closed: false,
    unit: "mm",
    phaseUnit: "mm",
    phaseIntervals: [13, 0.001],
    spans: [
      [
        [0, 0, 0],
        [1 / 3, 0, 0],
        [2 / 3, 1 / 3, 0],
        [2 / 3, 1, 0],
      ],
      [
        [2 / 3, 1, 0],
        [2 / 3, 2, 0],
        [2 / 3, 3, 0],
        [2 / 3, 4, 0],
      ],
    ],
  };
  const cubicBefore: string = JSON.stringify(cubic);
  for (const count of [1, 5]) {
    const wrapped: ReturnType<typeof measureAutoMovieCubicCurveLength64> =
      measureAutoMovieCubicCurveLength64(cubic, count);
    near(
      failures,
      "original cubic physical length",
      wrapped.lengthMm,
      13 / 3,
      2e-12,
    );
    const direct: ReturnType<typeof measureAutoMovieCurveLength64> =
      measureAutoMovieCurveLength64(
        [
          {
            domain: [0, 1],
            derivative: (t: number): Readonly<AutoMovieVector3Tuple> => [
              1 - t * t,
              2 * t,
              0,
            ],
          },
          {
            domain: [4, 5],
            derivative: (): Readonly<AutoMovieVector3Tuple> => [0, 3, 0],
          },
        ],
        count,
      );
    near(
      failures,
      "public source physical length",
      direct.lengthMm,
      13 / 3,
      2e-12,
    );
    check(failures, "cubic difference is finite", wrapped.differenceMm >= 0);
  }
  check(
    failures,
    "original cubic controls unchanged",
    JSON.stringify(cubic) === cubicBefore,
  );

  // Legacy finite-final admission is distinct from strict source endpoint/underflow admission.
  const large: number = (Number.MAX_VALUE / 3) * 1.01;
  const extreme: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "finite final endpoint overflow",
    closed: false,
    unit: "mm",
    phaseUnit: "normalized",
    phaseIntervals: [1],
    spans: [
      [
        [0, 0, 0],
        [large, 0, 0],
        [large, 0, 0],
        [large, 0, 0],
      ],
    ],
  };
  near(
    failures,
    "legacy endpoint-only overflow retains finite length",
    measureAutoMovieCubicCurveLength64(extreme).lengthMm,
    large,
    64 * Number.EPSILON * large,
  );
  refuses(
    failures,
    "legacy nonfinite interior/final still refuses",
    (): unknown => measureAutoMovieCubicCurveLength64(extreme, 5),
  );
  refuses(
    failures,
    "strict original endpoint-overflow source refuses",
    (): unknown =>
      measureAutoMovieCurveLength64([
        {
          domain: [0, 1],
          derivative: (t: number): Readonly<AutoMovieVector3Tuple> => [
            3 * ((1 - t) * (1 - t) * large),
            0,
            0,
          ],
        },
      ]),
  );
  let oldMessage: string = "";
  try {
    measureAutoMovieCubicCurveLength64(extreme, 5);
  } catch (error) {
    oldMessage = error instanceof Error ? error.message : "";
  }
  check(
    failures,
    "legacy overflow error text retained",
    oldMessage === "Cubic speed integration overflow",
  );
  const tiny: number = Number.MIN_VALUE;
  const subnormal: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "legacy subnormal rounding",
    closed: false,
    unit: "mm",
    phaseUnit: "normalized",
    phaseIntervals: [1],
    spans: [
      [
        [0, 0, 0],
        [tiny, 0, 0],
        [2 * tiny, 0, 0],
        [3 * tiny, 0, 0],
      ],
    ],
  };
  const rounded: ReturnType<typeof measureAutoMovieCubicCurveLength64> =
    measureAutoMovieCubicCurveLength64(subnormal);
  near(
    failures,
    "legacy subnormal finite-final length",
    rounded.lengthMm,
    0,
    0,
  );
  near(
    failures,
    "legacy subnormal finite-final difference",
    rounded.differenceMm,
    0,
    0,
  );

  // Query counters belong to these pure-result test callbacks, never to a foreign method.
  let reads: number = 0;
  let outside: boolean = false;
  const bounded: ReturnType<typeof measureAutoMovieCurveLength64> =
    measureAutoMovieCurveLength64(
      [
        {
          domain: [2, 3],
          derivative: (t: number): Readonly<AutoMovieVector3Tuple> => {
            ++reads;
            outside ||= t < 2 || t > 3;
            return [1, 0, 0];
          },
        },
      ],
      1024,
    );
  near(failures, "maximum subdivision budget line", bounded.lengthMm, 1, 2e-12);
  check(
    failures,
    "closed-domain evaluation budget",
    reads === 24 * 1024 + 2 && !outside,
  );
  const constant: (
    t: number,
  ) => Readonly<AutoMovieVector3Tuple> = (): Readonly<AutoMovieVector3Tuple> => [
    1, 0, 0,
  ];
  refuses(failures, "empty pieces", (): unknown =>
    measureAutoMovieCurveLength64([]),
  );
  for (const domain of [
    [0, 0],
    [1, 0],
    [-Number.MAX_VALUE, Number.MAX_VALUE],
    [1, 1 + Number.EPSILON],
  ] as [number, number][])
    refuses(failures, "invalid or collapsed domain " + domain, (): unknown =>
      measureAutoMovieCurveLength64([{ domain, derivative: constant }]),
    );
  for (const count of [0, -1, 1025]) {
    refuses(failures, "source subdivision " + count, (): unknown =>
      measureAutoMovieCurveLength64(
        [{ domain: [0, 1], derivative: constant }],
        count,
      ),
    );
    refuses(failures, "cubic subdivision " + count, (): unknown =>
      measureAutoMovieCubicCurveLength64(cubic, count),
    );
  }
  refuses(failures, "nonfinite interior derivative", (): unknown =>
    measureAutoMovieCurveLength64([
      {
        domain: [0, 1],
        derivative: (t: number): Readonly<AutoMovieVector3Tuple> => [
          t === 0 || t === 1 ? 1 : Infinity,
          0,
          0,
        ],
      },
    ]),
  );
  refuses(failures, "unrepresentable speed", (): unknown =>
    measureAutoMovieCurveLength64([
      {
        domain: [0, 1],
        derivative: (): Readonly<AutoMovieVector3Tuple> => [
          Number.MAX_VALUE,
          Number.MAX_VALUE,
          Number.MAX_VALUE,
        ],
      },
    ]),
  );
  refuses(failures, "unrepresentable length", (): unknown =>
    measureAutoMovieCurveLength64([
      {
        domain: [0, 4],
        derivative: (): Readonly<AutoMovieVector3Tuple> => [
          1e308, 1e308, 1e308,
        ],
      },
    ]),
  );
  refuses(failures, "underflowing contribution", (): unknown =>
    measureAutoMovieCurveLength64([
      {
        domain: [0, 1],
        derivative: (): Readonly<AutoMovieVector3Tuple> => [
          Number.MIN_VALUE,
          0,
          0,
        ],
      },
    ]),
  );
  const marker: Error = new Error("original source failure");
  let propagated: boolean = false;
  try {
    measureAutoMovieCurveLength64([
      {
        domain: [0, 1],
        derivative: (): Readonly<AutoMovieVector3Tuple> => {
          throw marker;
        },
      },
    ]);
  } catch (error) {
    propagated = error === marker;
  }
  check(failures, "original callback exception propagates", propagated);
  if (failures.length !== 0)
    throw new Error(
      failures.length + " source length findings:\n" + failures.join("\n"),
    );
}

/**
 * Collect independent finite scalar comparisons without stopping the inspection
 * at its first finding.
 */
function near(
  failures: string[],
  label: string,
  actual: number,
  expected: number,
  tolerance: number,
): void {
  try {
    TestValidator.predicate(label, nclose(actual, expected, tolerance));
  } catch {
    failures.push(label + ": " + actual + ", expected " + expected);
  }
}

/** Collect a non-numeric contract observation. */
function check(failures: string[], label: string, condition: boolean): void {
  try {
    TestValidator.predicate(label, condition);
  } catch {
    failures.push(label);
  }
}

/**
 * Require explicit refusal while letting the complete round inspect every
 * supplied failure cause.
 */
function refuses(
  failures: string[],
  label: string,
  action: () => unknown,
): void {
  let refused: boolean = false;
  try {
    action();
  } catch {
    refused = true;
  }
  check(failures, label + " refuses", refused);
}

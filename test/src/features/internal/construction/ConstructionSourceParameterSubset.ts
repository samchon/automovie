import {
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieLoftViewWorldJet,
  AutoMovieViewAxis,
  AutoMovieViewCurves,
  AutoMovieViewLoft,
  AutoMovieViewOutline,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { nclose } from "../nclose";

/** Value and two derivatives in the coordinate stated by their producer. */
type Scalar = readonly [number, number, number];

/** Original scalar sites; changing a retained interval never removes these controls. */
const SITES: readonly number[] = [0, 1.5, 2.5, 4];

/** Distinct authored support amplitudes, in millimetres. */
const AMPLITUDES: readonly number[] = [3, 4, 5, 6];

/** Distinct dimensionless cubic coefficients, independent of any emitted geometry. */
const ASYMMETRIES: readonly number[] = [0.2, -0.1, 0.3, -0.2];

/**
 * Original angle-coordinate cubics survive one-pole and regular subdomains.
 *
 * Scenarios:
 * 1. Full, bottom-only, top-only and regular middle domains preserve original
 *    controls and independently derived scalar2, cap2 and guide world2.
 * 2. Actual curves, direct sources and lofts keep real pole Point0 and absent
 *    singular station2, while removed endpoints stay outside the final chain.
 * 3. Wrong zero, pole, singular endpoint, inward side and parameter domain
 *    retain their original named refusal categories.
 *
 * Four different supports are A*t*(1-t)*(1+B*t), t=theta/pi. Authored value
 * and normalized2 reproduce those cubics exactly. Elementary differentiation
 * supplies physical2; the original cap is the stated quintic on spans of 1.5.
 * Cuts meet removed caps only at their zero2 support boundaries; their effects
 * vanish on the retained interval. Guide world2 uses the rational
 * quadratic endpoint curvature a/(2*w^2*b^2) and the smaller adjacent value.
 * Absolute 3e-9 per mm/station/radian component covers binary64 evaluation.
 * Every subset and every refusal runs before the owning CPU test reports;
 * no process, viewer, external fixture or implementation-derived oracle runs.
 */
export function ConstructionSourceParameterSubset(failures: string[]): void {
  for (const [first, last, pole] of [
    [0, 4, "both"],
    [0, 2.5, "bottom"],
    [1.5, 4, "top"],
    [1.5, 2.5, undefined],
  ] as const) {
    try {
      subset(first, last, pole, failures);
    } catch (error: unknown) {
      failures.push(
        `retained ${first}/${last}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
    }
  }
  refusals(failures);
}

/** Full original controls and their exact whole-parameter jets precede any loft. */
function original(): IAutoMovieViewPart {
  const edge: (q: number) => IAutoMovieViewPart.IOutline = (
    q: number,
  ): IAutoMovieViewPart.IOutline => ({
    parameter: { type: "angle", bottom: 0, top: 4 },
    knots: SITES.map((station: number): IAutoMovieViewPart.IKnot => {
      const at: Scalar = polynomial(
        q,
        (2 * Math.asin(Math.sqrt(station / 4))) / Math.PI,
      );
      const sign: number = q < 2 ? 1 : -1;
      return {
        site: `original ${q}/${station}`,
        station,
        value: sign * at[0],
        jet: { first: sign * at[1], second: sign * at[2] },
      };
    }),
  });
  return {
    name: "parameter.subset",
    axis: AutoMovieViewAxis.straight([7, 0, -3], [1, 0, 0], [0, 0, 1]),
    stations: [0, 0.5, 1.5, 2.5, 3.5, 4],
    front: { positive: edge(0), negative: edge(2) },
    side: { positive: edge(1), negative: edge(3) },
    fullness: {
      kind: "shoulder",
      shoulder: {
        knots: [0, 4].map(
          (station: number): IAutoMovieViewPart.IKnot => ({
            site: `fullness ${station}`,
            station,
            value: 0.3,
          }),
        ),
      },
    },
    pole: "both",
    order: 32,
    samples: 16,
  };
}

/** Retain the exact input functions while changing only actual output interval and closures. */
function subset(
  first: number,
  last: number,
  pole: IAutoMovieViewPart["pole"],
  failures: string[],
): void {
  const full: IAutoMovieViewPart = original();
  const part: IAutoMovieViewPart = {
    ...full,
    stations: full.stations.filter(
      (station: number): boolean => station >= first && station <= last,
    ),
    pole,
  };
  const curves: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(part);
  const source: AutoMovieLoftViewSource.IResult | null =
    AutoMovieLoftViewSource.create(part);
  const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
  if (
    curves.diagnostics.length !== 0 ||
    source === null ||
    source.source === null ||
    loft.chain === null ||
    loft.surface === null ||
    loft.diagnostics.length !== 0
  )
    throw new Error(
      JSON.stringify([
        curves.diagnostics,
        source?.diagnostics,
        loft.diagnostics,
      ]),
    );
  const chain: IAutoMovieLoftChain = loft.chain;
  const quarters: readonly number[] = [0, 2, 1, 3];
  for (const [index, curve] of curves.curves.entries()) {
    if (curve.outline === null)
      throw new Error("A retained source edge disappeared.");
    const map: AutoMovieConstructionOutlineParameter | undefined =
      curve.outline.parameter;
    if (
      map?.type !== "angle" ||
      map.bottom !== 0 ||
      map.top !== 4 ||
      curve.outline.knots.length !== 4
    )
      failures.push(
        "Retained scalar preparation changed its original coordinate or controls.",
      );
    for (const [k, knot] of curve.outline.knots.entries()) {
      const station: number = SITES[k]!;
      const expected: Scalar = polynomial(
        quarters[index]!,
        (2 * Math.asin(Math.sqrt(station / 4))) / Math.PI,
      );
      const sign: number = quarters[index]! < 2 ? 1 : -1;
      if (knot.station !== station)
        failures.push("A retained source control moved.");
      close(knot.value, sign * expected[0], failures, "original control value");
      close(
        knot.jet?.first ?? NaN,
        sign * expected[1],
        failures,
        "original control first",
      );
      close(
        knot.jet?.second ?? NaN,
        sign * expected[2],
        failures,
        "original control second",
      );
    }
    for (const station of [0.25, 0.75, 1.5, 2, 2.5, 3.25, 3.75].filter(
      (s: number): boolean => s >= first && s <= last,
    )) {
      const read: AutoMovieViewCurves.IReading | string =
        AutoMovieViewCurves.at(curve, part.axis, station);
      if (typeof read === "string" || read.scalar.stationJet === null)
        throw new Error(String(read));
      const q: number = quarters[index]!;
      const expected: Scalar = scalar(q, station);
      const sign: number = q < 2 ? 1 : -1;
      vector(
        [read.scalar.value, ...read.scalar.stationJet],
        expected.map((value: number): number => sign * value),
        failures,
        "original scalar2",
      );
      vector(read.point, world(q, station).p, failures, "original view point");
    }
  }
  for (const station of [0.25, 0.75, 1.5, 2, 2.5, 3.25, 3.75].filter(
    (s: number): boolean => s >= first && s <= last,
  )) {
    const inputs: AutoMovieLoftViewRead.IJets | string =
      AutoMovieLoftViewRead.jets(source.source, station);
    if (typeof inputs === "string") throw new Error(inputs);
    for (let q: number = 0; q < 4; q++) {
      vector(
        inputs.extents[q]!,
        scalar(q, station),
        failures,
        "retained extent2",
      );
      vector(
        inputs.shoulders[q]!,
        shoulder(station),
        failures,
        "original cap2",
      );
      const phase: number = (q * Math.PI) / 2;
      const actual: ReturnType<typeof AutoMovieLoftViewWorldJet> =
        AutoMovieLoftViewWorldJet(source.source, part.axis, station, phase);
      if (typeof actual === "string") throw new Error(actual);
      const expected: AutoMovieLoftJet.IJet = world(q, station);
      jets(
        {
          p: actual.p,
          s: actual.u,
          t: actual.v,
          ss: actual.uu,
          st: actual.uv,
          tt: actual.vv,
        },
        expected,
        failures,
        "original world2",
      );
      jets(
        AutoMovieLoftJet.at(chain, station, phase),
        expected,
        failures,
        "actual loft world2",
      );
    }
  }
  for (const end of ["bottom", "top"] as const) {
    const station: number = end === "bottom" ? 0 : 4;
    const closed: boolean = pole === end || pole === "both";
    const actualPole: IAutoMovieLoftChain["pole"] = [
      chain.pole,
      chain.opposite,
    ].find((entry: IAutoMovieLoftChain["pole"]): boolean => entry?.end === end);
    if (
      (actualPole !== undefined) !== closed ||
      source.source.caps.some(
        (cap: (typeof source.source.caps)[number]): boolean =>
          cap.pole === station,
      ) !== closed
    )
      failures.push("A parameter endpoint invented or erased an actual cap.");
    const outline: AutoMovieViewOutline.IOutline = curves.curves[0]!.outline!;
    const read: AutoMovieViewOutline.IReading | string =
      AutoMovieViewOutline.at(outline, station);
    if (
      typeof read === "string" ||
      read.stationJet !== null ||
      read.stationJetStatus !==
        (closed ? "singular-pole" : "singular-parameter")
    )
      failures.push(
        "Actual pole and nonclosing singular parameter endpoint were conflated.",
      );
    if (closed) {
      vector(
        AutoMovieLoftChain.point(chain, station, 0.37),
        [7, station, -3],
        failures,
        "owned pole Point0",
      );
      if (
        typeof AutoMovieLoftViewRead.jets(source.source, station) !== "string"
      )
        failures.push("A pole acquired a fabricated physical2.");
    } else {
      let refused: boolean = false;
      try {
        AutoMovieLoftChain.point(chain, station, 0.37);
      } catch {
        refused = true;
      }
      if (!refused)
        failures.push(
          "A removed endpoint was revived outside the final chain's retained domain.",
        );
    }
  }
}

/** A*t*(1-t)*(1+B*t) and its two derivatives in the whole normalized angle. */
function polynomial(q: number, t: number): Scalar {
  const a: number = AMPLITUDES[q]!;
  const b: number = ASYMMETRIES[q]!;
  return [
    a * t * (1 - t) * (1 + b * t),
    a * (1 + 2 * (b - 1) * t - 3 * b * t * t),
    a * (2 * (b - 1) - 6 * b * t),
  ];
}

/** Explicit angle chain rule, independently of the prepared scalar reader. */
function scalar(q: number, station: number): Scalar {
  const product: number = station * (4 - station);
  const first: number = 1 / (Math.PI * Math.sqrt(product));
  const second: number = (station - 2) / (Math.PI * product ** 1.5);
  const value: Scalar = polynomial(
    q,
    (2 * Math.asin(Math.sqrt(station / 4))) / Math.PI,
  );
  return [
    value[0],
    value[1] * first,
    value[2] * first * first + value[1] * second,
  ];
}

/** The original nearest-knot quintic cap is unchanged on each retained interval. */
function shoulder(station: number): Scalar {
  if (station >= 1.5 && station <= 2.5) return [0.3, 0, 0];
  const x: number = (station < 1.5 ? station : 4 - station) / 1.5;
  const dx: number = (station < 1.5 ? 1 : -1) / 1.5;
  const difference: number = Math.SQRT2 - 1 - 0.3;
  return [
    0.3 + difference * (1 - 10 * x ** 3 + 15 * x ** 4 - 6 * x ** 5),
    difference * (-30 * x ** 2 + 60 * x ** 3 - 30 * x ** 4) * dx,
    difference * (-60 * x + 180 * x ** 2 - 120 * x ** 3) * dx * dx,
  ];
}

/** Guide position, station2 and phase2 from the original supports and endpoint curvature. */
function world(q: number, station: number): AutoMovieLoftJet.IJet {
  const r: Scalar = scalar(q, station);
  const adjacent: number[] = [
    scalar((q + 3) % 4, station)[0],
    scalar((q + 1) % 4, station)[0],
  ];
  const share: number = shoulder(station)[0];
  const weight: number = share / (1 - share);
  const curvature: number = Math.min(
    ...adjacent.map(
      (b: number): number => r[0] / (2 * weight * weight * b * b),
    ),
  );
  const radial: readonly number[] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ][q]!;
  const turn: readonly number[] = [-radial[1]!, radial[0]!];
  return {
    p: [7 + r[0] * radial[0]!, station, -3 + r[0] * radial[1]!],
    s: [r[1] * radial[0]!, 1, r[1] * radial[1]!],
    t: [r[0] * turn[0]!, 0, r[0] * turn[1]!],
    ss: [r[2] * radial[0]!, 0, r[2] * radial[1]!],
    st: [r[1] * turn[0]!, 0, r[1] * turn[1]!],
    tt: [
      -curvature * r[0] * r[0] * radial[0]!,
      0,
      -curvature * r[0] * r[0] * radial[1]!,
    ],
  };
}

/** Keep all original zero, endpoint, inward-side and finite-domain refusals. */
function refusals(failures: string[]): void {
  const outline: IAutoMovieViewPart.IOutline = original().front.positive;
  const parameters: readonly [
    string,
    AutoMovieConstructionOutlineParameter,
    AutoMovieViewOutline.IEnds,
  ][] = [
    ["bottom endpoint", { type: "angle", bottom: -1, top: 4 }, { bottom: 0 }],
    ["top endpoint", { type: "angle", bottom: 0, top: 5 }, { top: 4 }],
    ["inward side", { type: "root", end: "top", pole: 0 }, { bottom: 0 }],
    ["root endpoint", { type: "root", end: "bottom", pole: -1 }, { bottom: 0 }],
    [
      "two actual poles",
      { type: "root", end: "bottom", pole: 0 },
      { bottom: 0, top: 4 },
    ],
  ];
  for (const [name, parameter, ends] of parameters)
    refusal({ ...outline, parameter }, ends, "pole parameter", name, failures);

  const regular: IAutoMovieViewPart.IOutline = structuredClone(outline);
  regular.knots[0]!.station = 0.5;
  refusal(
    regular,
    { bottom: 0.5 },
    "pole parameter",
    "regular claimed pole",
    failures,
  );
  const nonzero: IAutoMovieViewPart.IOutline = structuredClone(outline);
  nonzero.knots[0]!.value = 0.01;
  refusal(nonzero, { bottom: 0 }, "pole knot", "nonzero actual pole", failures);
  refusal(
    { ...outline, knots: outline.knots.slice(1) },
    { bottom: 0 },
    "pole knot",
    "missing original pole",
    failures,
  );
  refusal(
    { ...outline, parameter: { type: "angle", bottom: 0, top: Infinity } },
    { bottom: 0 },
    "outline",
    "nonfinite parameter",
    failures,
  );
  const outside: IAutoMovieViewPart.IOutline = structuredClone(outline);
  outside.knots[3]!.station = 5;
  refusal(outside, { bottom: 0 }, "outline", "outside original map", failures);
}

/** A refusal's category remains observable while the other malformed cases still run. */
function refusal(
  curve: IAutoMovieViewPart.IOutline,
  ends: AutoMovieViewOutline.IEnds,
  contract: string,
  name: string,
  failures: string[],
): void {
  try {
    const actual:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
      curve,
      ends,
    );
    if (!("detail" in actual) || actual.contract !== contract)
      failures.push(`${name}: lost its original ${contract} refusal.`);
  } catch (error: unknown) {
    failures.push(`${name}: ${String(error)}`);
  }
}

/** Observe complete world total2 against the independent guide equations. */
function jets(
  actual: AutoMovieLoftJet.IJet,
  expected: AutoMovieLoftJet.IJet,
  failures: string[],
  label: string,
): void {
  for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
    vector(actual[key], expected[key], failures, `${label}/${key}`);
}

/** Compare numeric vectors through the owning test's collected behavioral result. */
function vector(
  actual: readonly number[],
  expected: readonly number[],
  failures: string[],
  label: string,
): void {
  if (actual.length !== expected.length)
    failures.push(`${label}: vector widths differ.`);
  actual.forEach((value: number, index: number): void =>
    close(value, expected[index]!, failures, `${label}/${index}`),
  );
}

/** A fixed independent binary64 allowance does not depend on tessellation or admission. */
function close(
  actual: number,
  expected: number,
  failures: string[],
  label: string,
): void {
  if (!nclose(actual, expected, 3e-9))
    failures.push(`${label}: ${actual}, expected ${expected}.`);
}

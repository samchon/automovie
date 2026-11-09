import {
  type AutoMovieLoftFrame,
  AutoMovieViewAxis,
  AutoMovieViewCurves,
  AutoMovieViewLoft,
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";

/**
 * Original view curves remain observable before section admission, with their actual frames, knot identities, natural-cubic extrema and finite pole endpoints.
 *
 * Scenarios:
 * 1. The open natural spline through (0,1), (1,0.01), (2,0.01) is negative between its last two positive knots. Its exact zero-slope station 2-1/sqrt(3) is returned for sampling; a range clamp or a knot-only polyline fails the independent polynomial oracle.
 * 2. One bottom pole gives sqrt(s), one top pole gives sqrt(4-s), and two poles use sigma=2 asin(sqrt(s/4)) with the exact natural cubic through (0,0), (pi/2,1), (pi,0). Interior values and first/second station derivatives follow those closed forms. Pole values are zero, parameter jets finite and singular station jets absent; a station spline in place of sigma fails.
 * 3. A source part with invalid fullness still has four source curves and pole points, including between emitted stations. A nonlinear actual frame moves their world points directly; replacing it by a spline through layer frames fails the independent frame formula. Valid loft sections read the same source values at their emitted stations.
 * 4. One malformed edge leaves the other three intact. Missing pole zeros, repeated/nonfinite knots, outside-pole and nonfinite queries and nonfinite axis frames return explicit failures. Open curves retain their straight tangent extension. A constant source has no isolated critical station.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the shared source evaluator and the real ViewLoft consumer, including invalid fullness with no emitted sections. Observes original scalar and world points, scalar jets, extrema and explicit failures without relying on rendered samples or production section predicates.
 * @evidence contracts/development/testing.md#independent-expectations The three-knot natural spline's second interval is 0.01-0.495t+0.7425t^2-0.2475t^3 and its interior root of the derivative is t=1-1/sqrt(3). The two-knot pole curves are square roots; the symmetric three-knot angle spline is 3x/pi-4x^3/pi^3 on its first half. Ordinary differentiation and the independent frame o=(s^2,s,s^3), u=(cos(s),0,sin(s)) give the expected jets and world points. Tolerance 2e-11 covers floating evaluation of these unit-scale formulas. This proves source behavior, not equality with the final loft between layers or a world half-space constraint.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes open, single/both pole, interior extrema, invalid fullness, independent actual frames and partial source failures. Explicit negative controls compare the pole with linear station interpolation and the overshoot with nonnegative knot-only interpolation; both must differ.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU test through --include construction_source_curves, with no Human generation, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The open natural spline through (0,1), (1,0.01), (2,0.01) is negative between its last two positive knots. Its exact zero-slope station...).
 */
export function test_construction_source_curves(): void {
  const failures: string[] = [];
  const near = (name: string, actual: number, expected: number): void => {
    if (!(Math.abs(actual - expected) <= 2e-11))
      failures.push(`${name}: ${actual}, expected ${expected}`);
  };
  const read = (
    outline: AutoMovieViewOutline.IOutline,
    station: number,
  ): AutoMovieViewOutline.IReading => {
    const out: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(
      outline,
      station,
    );
    if (typeof out === "string") throw new Error(out);
    return out;
  };
  const overshoot: AutoMovieViewOutline.IOutline = prepared(
    knots([0, 1, 2], [1, 0.01, 0.01]),
  );
  if (
    overshoot.domain[0] !== 0 ||
    overshoot.domain[1] !== 2 ||
    overshoot.knots[1]!.site !== "site.1"
  )
    failures.push("source domain or named knot identity changed");
  const t: number = 0.5;
  near(
    "natural overshoot",
    read(overshoot, 1 + t).value,
    0.01 - 0.495 * t + 0.7425 * t * t - 0.2475 * t ** 3,
  );
  if (!(read(overshoot, 1.5).value < 0))
    failures.push(
      "red: knot-only nonnegative interpolation matches the source overshoot",
    );
  const extrema: number[] = AutoMovieViewOutline.criticalStations(overshoot);
  if (extrema.length !== 1)
    failures.push(`natural extrema count ${extrema.length}`);
  near("natural extremum station", extrema[0] ?? NaN, 2 - 1 / Math.sqrt(3));
  near(
    "natural extremum derivative",
    read(overshoot, extrema[0]!).stationJet![0],
    0,
  );
  for (const [s, expected, slope] of [
    [-1, 2.2375, -1.2375],
    [3, 0.2575, 0.2475],
  ]) {
    const extended: AutoMovieViewOutline.IReading = read(overshoot, s!);
    near(`curved source extension ${s}`, extended.value, expected!);
    near(`curved source extension first ${s}`, extended.stationJet![0], slope!);
    near(`curved source extension second ${s}`, extended.stationJet![1], 0);
  }
  if (
    AutoMovieViewOutline.criticalStations(prepared(knots([0, 1, 2], [2, 2, 2])))
      .length !== 0
  )
    failures.push("constant span has isolated extrema");
  const rooted: AutoMovieViewOutline.IOutline = prepared(
    knots([0, 1, 4], [0, 0.01, 0.01]),
    { bottom: 0 },
  );
  near(
    "root-parameter extremum station",
    AutoMovieViewOutline.criticalStations(rooted)[0] ?? NaN,
    (2 - 1 / Math.sqrt(3)) ** 2,
  );

  for (const top of [false, true]) {
    const outline: AutoMovieViewOutline.IOutline = prepared(
      knots([0, 4], top ? [2, 0] : [0, 2]),
      top ? { top: 4 } : { bottom: 0 },
    );
    for (const s of [0.25, 1, 2.25, 3.75]) {
      const d: number = top ? 4 - s : s;
      const actual: AutoMovieViewOutline.IReading = read(outline, s);
      near(`single pole ${top} value at ${s}`, actual.value, Math.sqrt(d));
      near(
        `single pole ${top} first at ${s}`,
        actual.stationJet![0],
        (top ? -1 : 1) / (2 * Math.sqrt(d)),
      );
      near(
        `single pole ${top} second at ${s}`,
        actual.stationJet![1],
        -1 / (4 * d ** 1.5),
      );
    }
    const endpoint: AutoMovieViewOutline.IReading = read(outline, top ? 4 : 0);
    if (
      endpoint.value !== 0 ||
      endpoint.location !== "pole" ||
      endpoint.stationJet !== null ||
      endpoint.stationJetStatus !== "singular-pole" ||
      !endpoint.parameterJet.every(Number.isFinite)
    )
      failures.push(
        `single pole ${top} endpoint is not finite with an absent singular station jet`,
      );
    if (typeof AutoMovieViewOutline.at(outline, top ? 4.1 : -0.1) !== "string")
      failures.push(`single pole ${top} accepts an outside query`);
    if (Math.abs(read(outline, 1).value - (top ? 1.5 : 0.5)) < 0.1)
      failures.push(`red: station-linear single pole ${top} matches sigma`);
    const extension: AutoMovieViewOutline.IReading = read(
      outline,
      top ? -5 : 9,
    );
    near(`single pole open extension ${top}`, extension.value, 3);
    near(
      `single pole open extension first ${top}`,
      extension.stationJet![0],
      (top ? -1 : 1) / 6,
    );
    near(
      `single pole open extension second ${top}`,
      extension.stationJet![1],
      -1 / 108,
    );
  }
  const both: AutoMovieViewOutline.IOutline = prepared(
    knots([0, 2, 4], [0, 1, 0]),
    { bottom: 0, top: 4 },
  );
  const close: AutoMovieViewOutline.IReading = read(
    prepared(knots([0, 4], [0, 2]), { bottom: 0 }),
    1e-310,
  );
  if (
    !(close.value > 0 && Number.isFinite(close.value)) ||
    close.stationJet !== null ||
    close.stationJetStatus !== "nonfinite"
  )
    failures.push(
      "a finite near-pole point is lost or its overflowing station jet is accepted",
    );
  for (const s of [0.1, 0.5, 1, 2, 3, 3.9]) {
    const x: number = 2 * Math.asin(Math.sqrt(s / 4));
    const z: number = Math.min(x, Math.PI - x);
    const f: number = (3 * z) / Math.PI - (4 * z ** 3) / Math.PI ** 3;
    const fx: number =
      (x <= Math.PI / 2 ? 1 : -1) * (3 / Math.PI - (12 * z * z) / Math.PI ** 3);
    const fxx: number = (-24 * z) / Math.PI ** 3;
    const dx: number = 1 / Math.sqrt(s * (4 - s));
    const dxx: number = (s - 2) / (s * (4 - s)) ** 1.5;
    const actual: AutoMovieViewOutline.IReading = read(both, s);
    near(`both pole value at ${s}`, actual.value, f);
    near(`both pole first at ${s}`, actual.stationJet![0], fx * dx);
    near(
      `both pole second at ${s}`,
      actual.stationJet![1],
      fxx * dx * dx + fx * dxx,
    );
  }
  for (const s of [0, 4])
    if (read(both, s).stationJet !== null || read(both, s).value !== 0)
      failures.push(`both pole endpoint ${s}`);
  const tiny: AutoMovieViewOutline.IReading = read(both, 1e-300);
  const tinyExpected: number = 3e-150 / Math.PI;
  if (!(Math.abs(tiny.value - tinyExpected) <= tinyExpected * 1e-13))
    failures.push(
      `near-bottom pole value ${tiny.value}, expected ${tinyExpected}`,
    );
  for (const s of [1e-12, 4 - 1e-12, 4 - 2 ** -49]) {
    const distance: number = Math.min(s, 4 - s);
    const angle: number = 2 * Math.asin(Math.sqrt(distance / 4));
    const expected: number =
      (3 * angle) / Math.PI - (4 * angle ** 3) / Math.PI ** 3;
    near(`near-pole symmetric value ${s}`, read(both, s).value, expected);
  }
  for (const s of [-1, 5, NaN, Infinity])
    if (typeof AutoMovieViewOutline.at(both, s) !== "string")
      failures.push(`both pole accepts ${s}`);

  const part: IAutoMovieViewPart = {
    name: "source",
    axis: {
      at: (s: number): AutoMovieLoftFrame.IFrame => ({
        origin: [s * s, s, s ** 3],
        u: [Math.cos(s), 0, Math.sin(s)],
        v: [-Math.sin(s), 0, Math.cos(s)],
      }),
    },
    stations: [0, 1, 2, 3, 4],
    front: {
      positive: knots([0, 2, 4], [0, 1, 0]),
      negative: knots([0, 2, 4], [0, -1, 0]),
    },
    side: {
      positive: knots([0, 2, 4], [0, 2, 0]),
      negative: knots([0, 2, 4], [0, -2, 0]),
    },
    fullness: { kind: "shoulder", shoulder: knots([0, 4], [NaN, NaN]) },
    pole: "both",
    order: 16,
    samples: 32,
  };
  const source: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(part);
  const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
  if (
    source.diagnostics.length !== 0 ||
    source.curves.length !== 4 ||
    loft.sections.length !== 0 ||
    loft.diagnostics.length === 0
  )
    failures.push(
      "invalid fullness hides or invalidates independent source edges",
    );
  for (const s of [0, 0.5, 2, 4]) {
    const actual: AutoMovieViewCurves.IReading | string =
      AutoMovieViewCurves.at(source.curves[0]!, part.axis, s);
    if (typeof actual === "string") failures.push(actual);
    else {
      const radius: number = read(both, s).value;
      [s * s + radius * Math.cos(s), s, s ** 3 + radius * Math.sin(s)].forEach(
        (expected: number, c: number): void =>
          near(`actual source frame ${s}/${c}`, actual.point[c]!, expected),
      );
    }
  }
  const valid: IAutoMovieViewPart = {
    ...part,
    axis: AutoMovieViewAxis.horizontal(),
    fullness: {
      kind: "shoulder",
      shoulder: knots([0, 4], [Math.SQRT2 - 1, Math.SQRT2 - 1]),
    },
  };
  const built: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(valid);
  if (built.sections.length < 2 || built.chain === null)
    failures.push("valid source no longer lofts");
  for (const section of built.sections)
    near(
      `production source at ${section.station}`,
      section.section.box.extents[0],
      read(both, section.station).value,
    );

  const broken: IAutoMovieViewPart = {
    ...part,
    front: { ...part.front, positive: knots([0, 0], [0, 0]) },
  };
  const partial: AutoMovieViewCurves.IResult =
    AutoMovieViewCurves.create(broken);
  if (
    partial.diagnostics.length !== 1 ||
    partial.curves.filter(
      (c: AutoMovieViewCurves.ICurve): boolean => c.outline !== null,
    ).length !== 3
  )
    failures.push("one malformed edge hides its three valid neighbours");
  const invalid: (
    | AutoMovieViewOutline.IOutline
    | AutoMovieViewOutline.IFailure
  )[] = [
    AutoMovieViewOutline.create(knots([0, 4], [1, 0]), { bottom: 0 }),
    AutoMovieViewOutline.create(knots([0, NaN], [0, 1])),
    AutoMovieViewOutline.create(knots([0, 1], [0, Infinity])),
    AutoMovieViewOutline.create(knots([0, 0], [0, 1])),
    AutoMovieViewOutline.create(
      knots([0, 1], [-Number.MAX_VALUE, Number.MAX_VALUE]),
    ),
  ];
  if (
    invalid.some((out: (typeof invalid)[number]): boolean => !("detail" in out))
  )
    failures.push("malformed source admitted");
  const open: AutoMovieViewOutline.IOutline = prepared(knots([0, 1], [2, 5]));
  for (const s of [-1, 2]) {
    near(`tangent extension ${s}`, read(open, s).value, 2 + 3 * s);
    if (read(open, s).location !== "extension")
      failures.push(`extension ${s} not qualified`);
  }
  for (const [outline, stations] of [
    [overshoot, [-1, 0, 0.5, 1, 1.5, 2, 3]],
    [both, [0, 1e-300, 1, 2, 4 - 1e-12, 4]],
  ] as const)
    for (const s of stations)
      near(
        `value-only source ${s}`,
        AutoMovieViewOutline.value(outline, s) as number,
        read(outline, s).value,
      );
  if (typeof AutoMovieViewOutline.value(both, -1) !== "string")
    failures.push("value-only source accepts an outside-pole query");
  if (
    typeof AutoMovieViewCurves.at(
      source.curves[0]!,
      {
        at: (): AutoMovieLoftFrame.IFrame => ({
          origin: [NaN, 0, 0],
          u: [1, 0, 0],
          v: [0, 0, 1],
        }),
      },
      1,
    ) !== "string"
  )
    failures.push("nonfinite actual frame admitted");
  const thrown: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(
    source.curves[0]!,
    {
      at: (): AutoMovieLoftFrame.IFrame => {
        throw new Error("made-axis-failure");
      },
    },
    1,
  );
  if (
    typeof thrown !== "string" ||
    !thrown.includes("made-axis-failure") ||
    !thrown.includes("front.positive at 1")
  )
    failures.push(
      "an axis exception loses its original cause or curve/station identity",
    );
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} source curve failures:\n${failures.join("\n")}`,
    );
}

/** Named synthetic source knots, with no Human specimen or production interpolation oracle. */
function knots(
  stations: readonly number[],
  values: readonly number[],
): IAutoMovieViewPart.IOutline {
  return {
    knots: stations.map(
      (station: number, i: number): IAutoMovieViewPart.IKnot => ({
        site: `site.${i}`,
        station,
        value: values[i]!,
      }),
    ),
  };
}

/** Admission used only to keep unexpected fixture failures explicit. */
function prepared(
  outline: IAutoMovieViewPart.IOutline,
  ends: AutoMovieViewOutline.IEnds = {},
): AutoMovieViewOutline.IOutline {
  const result: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create(outline, ends);
  if ("detail" in result) throw new Error(result.detail);
  return result;
}

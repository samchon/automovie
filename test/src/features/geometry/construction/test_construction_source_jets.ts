import {
  AutoMovieConstructionViews,
  AutoMovieViewCurves,
  AutoMovieViewLoft,
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Authored source jets reproduce their polynomial, while an explicit scalar hull range bounds complete source spans without changing default natural curves.
 *
 * Scenarios:
 * 1. Shared normalized jets reproduce f(t)=1-(2t-1)^4 through three knots at two scales. The middle is the exact maximum, both one-sided first/second jets agree, and the same admitted source is consumed by curve inspection and real loft sections.
 * 2. A quintic whose derivative has four independently known roots reports all four; a cubic stationary inflection reports its repeated zero-slope root. Null components retain natural derivatives and an explicit cubic is reproduced between knots and on its tangent extension.
 * 3. A two-pole synthetic sole with every interior knot on the physical floor overshoots with the default natural curve. The explicit [-height,0] range contains every complete span at dense independent observations and keeps finite closing values, without changing the default curve. This proves a fixed-frame scalar bound, not a moving world median or final loft fidelity between layers.
 * 4. Conflicting authored hulls are refused even when the independent curve itself is bounded, distinguishing sufficient hull admission from a necessary condition. Invalid bounds/jets and outside knots fail explicitly. Unit conversion preserves source parameters, normalized jets, signed ranges and dimensionless fullness jets.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads shared source values/jets/critical stations, production section values, original curve points and ConstructionViews conversion; explicit failures remain visible without substituting a curve.
 * @evidence contracts/development/testing.md#independent-expectations Closed forms are f(t)=8t-24t^2+32t^3-16t^4 and the integral of (t-.1)(t-.3)(t-.7)(t-.9). The bounded counterexample 16t^2(1-t)^2 has a control hull reaching1.6, so rejecting its hull cannot prove curve overflow. A fixed worldY=height+edge translates the scalar sole range directly. Finite comparisons use 2e-9 times scale for binary64 polynomial/parameter arithmetic; C2 comparisons approach an internal knot from both sides without requiring bit equality.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers authored versus natural/null jets, four roots and a repeated root, internal maximum, two unit scales, single/both parameter ends, actual scalar-bound versus hull-admission failure and signed/dimensionless conversion.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit through --include construction_source_jets; all curves are synthetic and no Human generation, viewer, timer or GPU is started.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Shared normalized jets reproduce f(t)=1-(2t-1)^4 through three knots at two scales. The middle is the exact maximum, both one-sided...).
 */
export function test_construction_source_jets(): void {
  const failures: string[] = [];
  const near: (
    name: string,
    actual: number,
    expected: number,
    scale?: number,
  ) => void = (
    name: string,
    actual: number,
    expected: number,
    scale: number = 1,
  ): void => {
    if (!(Number.isFinite(expected) && nclose(actual, expected, 2e-9 * scale)))
      failures.push(`${name}: ${actual}, expected ${expected}`);
  };
  const f: (t: number) => number = (t: number): number => 1 - (2 * t - 1) ** 4;
  const f1: (t: number) => number = (t: number): number =>
    -8 * (2 * t - 1) ** 3;
  const f2: (t: number) => number = (t: number): number =>
    -48 * (2 * t - 1) ** 2;
  for (const scale of [1, 1000]) {
    const raw: IAutoMovieViewPart.IOutline = {
      knots: [0, 0.5, 1].map(
        (t: number): IAutoMovieViewPart.IKnot => ({
          site: `authored.${t}`,
          station: t * 4 * scale,
          value: f(t) * scale,
          jet: { first: f1(t) * scale, second: f2(t) * scale },
        }),
      ),
      range: { minimum: 0, maximum: scale },
    };
    const curve: AutoMovieViewOutline.IOutline = prepare(raw);
    for (let i: number = 0; i <= 64; i++) {
      const t: number = i / 64;
      const actual: AutoMovieViewOutline.IReading = read(curve, 4 * scale * t);
      near(`authored value ${scale}/${t}`, actual.value, scale * f(t), scale);
      near(
        `authored first ${scale}/${t}`,
        actual.stationJet?.[0] ?? NaN,
        f1(t) / 4,
      );
      near(
        `authored second ${scale}/${t}`,
        actual.stationJet?.[1] ?? NaN,
        f2(t) / (16 * scale),
      );
      const scalar: number | string = AutoMovieViewOutline.value(
        curve,
        actual.station,
      );
      near(
        "value-only shared curve",
        typeof scalar === "number" ? scalar : NaN,
        actual.value,
        scale,
      );
    }
    for (const delta of [-1e-7, 0, 1e-7]) {
      const t: number = 0.5 + delta;
      const actual: AutoMovieViewOutline.IReading = read(curve, 4 * scale * t);
      near("shared maximum first", actual.stationJet?.[0] ?? NaN, f1(t) / 4);
      near(
        "shared maximum second",
        actual.stationJet?.[1] ?? NaN,
        f2(t) / (16 * scale),
      );
    }
    const constant: (value: number) => IAutoMovieViewPart.IOutline = (
      value: number,
    ): IAutoMovieViewPart.IOutline => ({
      knots: [
        { site: "a", station: 0, value },
        { site: "b", station: 4 * scale, value },
      ],
    });
    const part: IAutoMovieViewPart = {
      name: "source-jet",
      axis: {
        at: (s: number): ReturnType<IAutoMovieViewPart["axis"]["at"]> => ({
          origin: [0, s, 0],
          u: [1, 0, 0],
          v: [0, 0, 1],
        }),
      },
      stations: [0, 1, 2, 3, 4].map((s: number): number => s * scale),
      front: {
        positive: {
          ...raw,
          knots: raw.knots.map(
            (k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({
              ...k,
              value: k.value + 2 * scale,
            }),
          ),
          range: { minimum: 2 * scale, maximum: 3 * scale },
        },
        negative: constant(-scale),
      },
      side: { positive: constant(scale), negative: constant(-scale) },
      fullness: { kind: "shoulder", shoulder: constant(Math.SQRT2 - 1) },
      order: 32,
      samples: 16,
    };
    const sources: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(part);
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    if (
      sources.curves.length !== 4 ||
      sources.diagnostics.length !== 0 ||
      loft.diagnostics.length !== 0 ||
      loft.sections.length !== part.stations.length
    )
      failures.push(
        "authored source was not consumed by curves and all loft sections",
      );
    for (const section of loft.sections)
      near(
        "production section source value",
        section.section.box.extents[0],
        (2 + f(section.station / (4 * scale))) * scale,
        scale,
      );
    const point: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(
      sources.curves[0]!,
      part.axis,
      1.3 * scale,
    );
    if (typeof point === "string") failures.push(point);
    else
      near(
        "original curve interior",
        point.point[0],
        (2 + f(1.3 / 4)) * scale,
        scale,
      );
  }
  const polynomial: (t: number) => number = (t: number): number =>
    t ** 5 / 5 - t ** 4 / 2 + (1.3 * t ** 3) / 3 - 0.15 * t * t + 0.0189 * t;
  const four: AutoMovieViewOutline.IOutline = prepare({
    knots: [
      { site: "a", station: 0, value: 0, jet: { first: 0.0189, second: -0.3 } },
      {
        site: "b",
        station: 1,
        value: polynomial(1),
        jet: { first: 0.0189, second: 0.3 },
      },
    ],
  });
  const roots: number[] = AutoMovieViewOutline.criticalStations(four);
  if (roots.length !== 4)
    failures.push(`quintic critical count ${roots.length}, expected4`);
  [0.1, 0.3, 0.7, 0.9].forEach((t: number, i: number): void =>
    near("quintic critical parameter", roots[i] ?? NaN, t),
  );
  for (const t of [0.2, 0.5, 0.8])
    near("quintic closed form", read(four, t).value, polynomial(t));
  const repeated: AutoMovieViewOutline.IOutline = prepare({
    knots: [
      {
        site: "a",
        station: 0,
        value: -0.125,
        jet: { first: 0.75, second: -3 },
      },
      { site: "b", station: 1, value: 0.125, jet: { first: 0.75, second: 3 } },
    ],
  });
  const repeatedRoots: number[] =
    AutoMovieViewOutline.criticalStations(repeated);
  if (repeatedRoots.length !== 1)
    failures.push(`repeated critical count ${repeatedRoots.length}`);
  near("stationary inflection", repeatedRoots[0] ?? NaN, 0.5);
  near(
    "cubic Hermite reproduction",
    read(repeated, 0.25).value,
    (0.25 - 0.5) ** 3,
  );
  const extension: AutoMovieViewOutline.IReading = read(repeated, -1);
  near("authored tangent extension value", extension.value, -0.125 - 0.75);
  near(
    "authored tangent extension second",
    extension.stationJet?.[1] ?? NaN,
    0,
  );
  const nullable: AutoMovieViewOutline.IOutline = prepare({
    knots: [1, 2, 0].map(
      (value: number, station: number): IAutoMovieViewPart.IKnot => ({
        site: `null.${station}`,
        station,
        value,
        jet: { first: null, second: null },
      }),
    ),
  });
  const t: number = 0.25;
  near(
    "null jet natural value",
    read(nullable, t).value,
    1 + 1.75 * t - 0.75 * t ** 3,
  );
  near(
    "null jet natural first",
    read(nullable, t).stationJet?.[0] ?? NaN,
    1.75 - 2.25 * t * t,
  );
  near(
    "null jet natural second",
    read(nullable, t).stationJet?.[1] ?? NaN,
    -4.5 * t,
  );
  const filtered: AutoMovieViewOutline.IOutline = prepare({
    knots: [1, 0.01, 0.01].map(
      (value: number, station: number): IAutoMovieViewPart.IKnot => ({
        site: `ray.${station}`,
        station,
        value,
      }),
    ),
    range: { minimum: 0, maximum: 1 },
  });
  near(
    "range ray shared first",
    read(filtered, 1).stationJet?.[0] ?? NaN,
    -0.04,
  );
  near(
    "range ray shared second",
    read(filtered, 1).stationJet?.[1] ?? NaN,
    0.12,
  );
  near("range quintic interior", read(filtered, 1.5).value, 0.00171875);
  near(
    "range quintic interior first",
    read(filtered, 1.5).stationJet?.[0] ?? NaN,
    0.0028125,
  );
  near(
    "range quintic interior second",
    read(filtered, 1.5).stationJet?.[1] ?? NaN,
    0.0675,
  );
  for (const top of [false, true]) {
    const root: AutoMovieViewOutline.IOutline = prepare(
      {
        knots: [
          {
            site: "a",
            station: 0,
            value: top ? 2 : 0,
            jet: { first: top ? -2 : 2, second: 0 },
          },
          {
            site: "b",
            station: 4,
            value: top ? 0 : 2,
            jet: { first: top ? -2 : 2, second: 0 },
          },
        ],
      },
      top ? { top: 4 } : { bottom: 0 },
    );
    for (const s of [0.25, 1, 2.25, 3.75]) {
      const d: number = top ? 4 - s : s;
      near("normalized root jet value", read(root, s).value, Math.sqrt(d));
      near(
        "normalized root station first",
        read(root, s).stationJet?.[0] ?? NaN,
        (top ? -1 : 1) / (2 * Math.sqrt(d)),
      );
      near(
        "normalized root station second",
        read(root, s).stationJet?.[1] ?? NaN,
        -1 / (4 * d ** 1.5),
      );
    }
  }

  const sole: IAutoMovieViewPart.IOutline = {
    knots: [0, 0.05, 0.085, 0.3, 0.6, 0.9, 1].map(
      (s: number, i: number, all: number[]): IAutoMovieViewPart.IKnot => ({
        site: `sole.${i}`,
        station: s * 100,
        value: i === 0 || i === all.length - 1 ? 0 : -5,
      }),
    ),
  };
  const unconstrained: AutoMovieViewOutline.IOutline = prepare(sole, {
    bottom: 0,
    top: 100,
  });
  const bounded: AutoMovieViewOutline.IOutline = prepare(
    { ...sole, range: { minimum: -5, maximum: 0 } },
    { bottom: 0, top: 100 },
  );
  let naturalMinimum: number = 0;
  for (let i: number = 0; i <= 512; i++) {
    const s: number = (100 * i) / 512;
    naturalMinimum = Math.min(naturalMinimum, read(unconstrained, s).value);
    const actual: AutoMovieViewOutline.IReading = read(bounded, s);
    if (
      !(
        actual.value >= -5 - 1e-12 &&
        actual.value <= 1e-12 &&
        Number.isFinite(actual.value)
      )
    )
      failures.push(`bounded sole at${s}: ${actual.value}`);
  }
  if (!(naturalMinimum < -5.001))
    failures.push(
      "red: synthetic natural sole did not expose its floor overshoot",
    );
  near(
    "unchanged default sole",
    read(prepare(sole, { bottom: 0, top: 100 }), 10).value,
    read(unconstrained, 10).value,
  );
  for (const s of [0, 100])
    if (read(bounded, s).stationJetStatus !== "singular-pole")
      failures.push("bounded pole lost its original parameter qualification");

  const hullOnly: IAutoMovieViewPart.IOutline = {
    knots: [
      { site: "a", station: 0, value: 0, jet: { first: 0, second: 32 } },
      { site: "b", station: 1, value: 0, jet: { first: 0, second: 32 } },
    ],
  };
  near(
    "bounded curve with a wider hull",
    read(prepare(hullOnly), 0.5).value,
    1,
  );
  const refused: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      ...hullOnly,
      range: { minimum: 0, maximum: 1 },
    });
  if (
    !("detail" in refused) ||
    !refused.detail.includes("sufficient hull refusal")
  )
    failures.push(
      "authored hull refusal was confused with actual curve overflow",
    );
  for (const curve of [
    { ...sole, range: { minimum: 1, maximum: 0 } },
    { ...sole, range: { minimum: 0, maximum: 1 } },
    { ...sole, range: { minimum: NaN, maximum: null } },
    {
      knots: [
        {
          site: "a",
          station: 0,
          value: 0,
          jet: { first: Infinity, second: null },
        },
        { site: "b", station: 1, value: 1 },
      ],
    },
  ] as IAutoMovieViewPart.IOutline[])
    if (!("detail" in AutoMovieViewOutline.create(curve)))
      failures.push("invalid authored source was admitted");

  const original: IAutoMovieViewPart.IOutline = {
    ...sole,
    parameter: { type: "angle", bottom: 0, top: 100 },
    range: { minimum: -5, maximum: 0 },
    knots: sole.knots.map(
      (k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({
        ...k,
        jet: { first: 0, second: 0 },
      }),
    ),
  };
  const metres: IAutoMovieViewPart.IOutline = AutoMovieViewOutline.scale(
    original,
    0.001,
    0.001,
  );
  const nonzero: IAutoMovieViewPart.IOutline = AutoMovieViewOutline.scale(
    {
      knots: [
        { site: "a", station: 0, value: 2, jet: { first: 4, second: 6 } },
        { site: "b", station: 100, value: 3 },
      ],
    },
    0.001,
    0.001,
  );
  near(
    "length normalized first conversion",
    nonzero.knots[0]!.jet?.first ?? NaN,
    0.004,
  );
  near(
    "length normalized second conversion",
    nonzero.knots[0]!.jet?.second ?? NaN,
    0.006,
  );
  near("length bound conversion", metres.range?.minimum ?? NaN, -0.005);
  if (metres.parameter?.type !== "angle")
    failures.push("converted source parameter lost");
  else near("parameter endpoint conversion", metres.parameter.top, 0.1);
  const reflected: IAutoMovieViewPart.IOutline = AutoMovieViewOutline.scale(
    original,
    1,
    -2,
  );
  near("signed lower bound", reflected.range?.minimum ?? NaN, 0);
  near("signed upper bound", reflected.range?.maximum ?? NaN, 10);
  const share: IAutoMovieViewPart.IOutline = {
    knots: [
      { site: "a", station: 0, value: 0.4, jet: { first: 0.2, second: -0.3 } },
      { site: "b", station: 100, value: 0.5 },
    ],
    range: { minimum: 0, maximum: 1 },
  };
  const view: IAutoMovieConstructionView = {
    type: "view",
    name: "converted-jets",
    axis: {
      type: "straight",
      origin: { x: 0, y: 0, z: 0 },
      u: { x: 1, y: 0, z: 0 },
      v: { x: 0, y: 0, z: 1 },
    },
    stations: [0, 0.1],
    front: { positive: metres, negative: metres },
    side: { positive: metres, negative: metres },
    fullness: {
      type: "shoulder",
      shoulder: AutoMovieViewOutline.scale(share, 0.001, 1),
      departures: null,
    },
    pole: "open",
    order: 16,
    samples: 16,
  };
  const converted: IAutoMovieViewPart | string =
    AutoMovieConstructionViews.part(view);
  if (typeof converted === "string" || converted.fullness.kind !== "shoulder")
    failures.push("source declaration converter failed");
  else {
    near(
      "tree length bound",
      converted.front.positive.range?.minimum ?? NaN,
      -5,
    );
    near(
      "tree dimensionless first",
      converted.fullness.shoulder.knots[0]!.jet?.first ?? NaN,
      0.2,
    );
    near(
      "tree dimensionless second",
      converted.fullness.shoulder.knots[0]!.jet?.second ?? NaN,
      -0.3,
    );
  }
  TestValidator.predicate(
    `${failures.length} source jet/range findings:\n${failures.join("\n")}`,
    (): boolean => failures.length === 0,
  );
}

/** Prepare a synthetic source through the real admission seam, preserving any explicit diagnostic as a test failure. */
function prepare(
  outline: IAutoMovieViewPart.IOutline,
  ends: AutoMovieViewOutline.IEnds = {},
): AutoMovieViewOutline.IOutline {
  const result: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create(outline, ends);
  if ("detail" in result) throw new Error(result.detail);
  return result;
}

/** Read the shared original source value and its explicitly qualified analytic station jets. */
function read(
  outline: AutoMovieViewOutline.IOutline,
  station: number,
): AutoMovieViewOutline.IReading {
  const result: AutoMovieViewOutline.IReading | string =
    AutoMovieViewOutline.at(outline, station);
  if (typeof result === "string") throw new Error(result);
  return result;
}

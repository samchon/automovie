import {
  type AutoMovieLoftContract,
  type AutoMovieLoftFrame,
  AutoMovieViewLoft,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { HumanDebugReferencePieces } from "../../../../../packages/human/debug/compare/HumanDebugReferencePieces";
import { HumanDebugViewCurves } from "../../../../../packages/human/debug/compare/HumanDebugViewCurves";
import type { HumanDebugViewParts } from "../../../../../packages/human/debug/compare/HumanDebugViewParts";
import type { IHumanDebugDocument } from "../../../../../packages/human/debug/contracts/IHumanDebugDocument";

/**
 * Original 2D display survives rejected loft sections and preserves source knots,
 * scalar extrema, actual frames, finite poles and explicit missing support.
 *
 * Scenarios:
 * 1. A natural source through (0,2), (1,3), (2,3) remains visible when invalid
 *    fullness emits no sections. Its peak is at 2-1/sqrt(3), value
 *    3+1/(6sqrt(3)); its actual rotating frame and the 2 mm/mm person scale
 *    independently determine world coordinates. The reference crop still
 *    covers these source points without needing an admitted loft section.
 * 2. One malformed source edge leaves the three valid edges and axis visible,
 *    with its original failure. A throwing axis hides no error by connecting
 *    across it; the display reports the original exception.
 * 3. Two closing poles stay at their finite axis origins even with no sections.
 *    A valid loft with its middle box rejected keeps that malformed original
 *    outline visible; top.0 and top.2 retain source-knot identity, with top.1
 *    explicitly unavailable rather than silently renumbering top.2.
 * 4. Authored normalized jets in a root parameter give y=2+tau², tau=sqrt(s)/2.
 *    At s=2 the source value is 2.5, rather than the value-only natural 2+sqrt(0.5).
 *    The display preserves that finite nonzero parameter endpoint and interior reading.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual curve display, real ViewLoft and reference-crop consumer, checking coordinates, identities and diagnostics. It catches section-only displays, knot-only polylines, lost poles and crops coupled to section success.
 * @evidence contracts/development/testing.md#independent-expectations Ordinary natural-cubic algebra gives the peak station/value; explicit normalized endpoint jets give the quadratic 2+tau². The actual o=(10+s²,20+s,30), u=(cos(s),0,sin(s)) and 2 mm/mm scale independently give world points in metres by 0.002. Source knots, zero pole origins and missing middle-ring indices are input identities, not a generated snapshot. Coordinate tolerance 1e-11 m covers unit-scale floating evaluation.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers invalid fullness, a malformed single edge, a throwing axis, both poles, an invalid interior box, exact scalar extrema, explicit source jets/parameter/range and missing raw top sections. It does not assert a bounded world-curve tessellation error or equality with final loft interpolation.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit under --include human_debug_view_curves. Analytic source parts generate no person, file, renderer, browser or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A natural source through (0,2), (1,3), (2,3) remains visible when invalid).
 */
export function test_human_debug_view_curves(): void {
  const failures: string[] = [];
  const part: IAutoMovieViewPart = {
    name: "source",
    axis: {
      at: (s: number): AutoMovieLoftFrame.IFrame => ({
        origin: [10 + s * s, 20 + s, 30],
        u: [Math.cos(s), 0, Math.sin(s)],
        v: [-Math.sin(s), 0, Math.cos(s)],
      }),
    },
    stations: [0, 1, 2],
    front: {
      positive: outline([0, 1, 2], [2, 3, 3]),
      negative: outline([0, 2], [-2, -2]),
    },
    side: {
      positive: outline([0, 2], [3, 3]),
      negative: outline([0, 2], [-3, -3]),
    },
    fullness: { kind: "shoulder", shoulder: outline([0, 2], [NaN, NaN]) },
    order: 16,
    samples: 32,
  };
  const built: HumanDebugViewParts.IOutput = observed(part);
  const original: string = JSON.stringify(built.diagnostics);
  if (
    built.parts[0]!.loft?.sections.length !== 0 ||
    built.diagnostics.body.length === 0
  )
    throw new Error("The invalid-fullness premise did not reject the loft");
  const drawn: ReturnType<typeof HumanDebugViewCurves.of> =
    HumanDebugViewCurves.of(built);
  const unlofted: ReturnType<typeof HumanDebugViewCurves.of> =
    HumanDebugViewCurves.of({
      ...built,
      parts: [{ ...built.parts[0]!, loft: null }],
    });
  if (
    unlofted.curves.filter(
      (curve: IHumanDebugDocument.ICurve): boolean =>
        !curve.id.includes("/top."),
    ).length !== 5 ||
    unlofted.curves.some((curve: IHumanDebugDocument.ICurve): boolean =>
      curve.id.includes("/top."),
    )
  )
    failures.push(
      "An unavailable raw loft hid its original source or invented a top ring",
    );
  for (const name of ["front.pos", "front.neg", "side.pos", "side.neg", "axis"])
    if (
      !drawn.curves.some(
        (curve: IHumanDebugDocument.ICurve): boolean =>
          curve.id === "human.construction.view.source/" + name,
      )
    )
      failures.push("Rejected fullness hid " + name);
  const edge: IHumanDebugDocument.ICurve | undefined = drawn.curves.find(
    (curve: IHumanDebugDocument.ICurve): boolean =>
      curve.id.endsWith("/front.pos"),
  );
  const peak: number = 2 - 1 / Math.sqrt(3);
  for (const [s, radius] of [
    [0, 2],
    [1, 3],
    [2, 3],
    [peak, 3 + 1 / (6 * Math.sqrt(3))],
  ]) {
    const expected: number[] = [
      (10 + s! * s! + radius! * Math.cos(s!)) * 0.002,
      (20 + s!) * 0.002,
      (30 + radius! * Math.sin(s!)) * 0.002,
    ];
    if (
      !edge?.points.some((point: IHumanDebugDocument.Point): boolean =>
        point.every(
          (value: number, c: number): boolean =>
            Math.abs(value - expected[c]!) <= 1e-11,
        ),
      )
    )
      failures.push("Original knot/extremum missing at " + s);
    const keep: ReturnType<typeof HumanDebugReferencePieces> =
      HumanDebugReferencePieces(["source"], drawn.curves);
    if (
      !keep(
        "head",
        expected[0]! * 1000,
        expected[1]! * 1000,
        expected[2]! * 1000,
      )
    )
      failures.push(
        "Rejected loft removed the original curve's reference crop",
      );
    if (keep("head", 10000, 10000, 10000))
      failures.push("A source crop kept a distant point");
  }
  if (JSON.stringify(built.diagnostics) !== original)
    failures.push("Drawing changed original producer diagnostics");

  const parameterized: IAutoMovieViewPart = {
    ...part,
    stations: [0, 2, 4],
    front: {
      ...part.front,
      positive: {
        parameter: { type: "root", end: "bottom", pole: 0 },
        range: { minimum: 2, maximum: 3 },
        knots: [
          { site: "start", station: 0, value: 2, jet: { first: 0, second: 2 } },
          { site: "end", station: 4, value: 3, jet: { first: 2, second: 2 } },
        ],
      },
    },
  };
  const controls: string = JSON.stringify(parameterized);
  const authored: IHumanDebugDocument.ICurve | undefined =
    HumanDebugViewCurves.of(observed(parameterized)).curves.find(
      (curve: IHumanDebugDocument.ICurve): boolean =>
        curve.id.endsWith("/front.pos"),
    );
  for (const [s, radius] of [
    [0, 2],
    [2, 2.5],
    [4, 3],
  ]) {
    const expected: number[] = [
      (10 + s! * s! + radius! * Math.cos(s!)) * 0.002,
      (20 + s!) * 0.002,
      (30 + radius! * Math.sin(s!)) * 0.002,
    ];
    if (
      !authored?.points.some((point: IHumanDebugDocument.Point): boolean =>
        point.every(
          (value: number, c: number): boolean =>
            Math.abs(value - expected[c]!) <= 1e-11,
        ),
      )
    )
      failures.push("Authored source metadata was lost at " + s);
  }
  if (JSON.stringify(parameterized) !== controls)
    failures.push("Drawing mutated authored source controls");

  const broken: ReturnType<typeof HumanDebugViewCurves.of> =
    HumanDebugViewCurves.of(
      observed({
        ...part,
        front: { ...part.front, positive: outline([0, 0], [2, 3]) },
      }),
    );
  if (
    broken.curves.filter((curve: IHumanDebugDocument.ICurve): boolean =>
      /\/(front|side)\./.test(curve.id),
    ).length !== 3 ||
    !broken.diagnostics.some((d: AutoMovieLoftContract.IDiagnostic): boolean =>
      d.detail.includes("front.positive"),
    )
  )
    failures.push("One invalid source edge hid neighbours or its diagnostic");
  const thrown: ReturnType<typeof HumanDebugViewCurves.of> =
    HumanDebugViewCurves.of({
      ...built,
      parts: [
        {
          ...built.parts[0]!,
          part: {
            ...part,
            axis: {
              at: (): AutoMovieLoftFrame.IFrame => {
                throw new Error("source-axis-cause");
              },
            },
          },
        },
      ],
    });
  if (
    thrown.curves.length !== 0 ||
    !thrown.diagnostics.some((d: AutoMovieLoftContract.IDiagnostic): boolean =>
      d.detail.includes("source-axis-cause"),
    )
  )
    failures.push(
      "An invalid axis was connected across or lost its original error",
    );

  const poles: IAutoMovieViewPart = {
    ...part,
    stations: [0, 2, 4],
    pole: "both",
    front: {
      positive: outline([0, 2, 4], [0, 1, 0]),
      negative: outline([0, 2, 4], [0, -1, 0]),
    },
    side: {
      positive: outline([0, 2, 4], [0, 2, 0]),
      negative: outline([0, 2, 4], [0, -2, 0]),
    },
  };
  const polar: ReturnType<typeof HumanDebugViewCurves.of> =
    HumanDebugViewCurves.of(observed(poles));
  for (const curve of polar.curves.filter(
    (curve: IHumanDebugDocument.ICurve): boolean =>
      /\/(front|side)\./.test(curve.id),
  ))
    for (const [point, s] of [
      [curve.points[0]!, 0],
      [curve.points[curve.points.length - 1]!, 4],
    ] as const) {
      const origin: readonly number[] = poles.axis.at(s).origin;
      if (
        !point.every(
          (value: number, c: number): boolean =>
            Number.isFinite(value) &&
            Math.abs(value - origin[c]! * 0.002) <= 1e-11,
        )
      )
        failures.push("A finite pole endpoint was lost: " + curve.id);
    }
  const middle: IAutoMovieViewPart = {
    ...part,
    front: { ...part.front, positive: outline([0, 1, 2], [3, -1, 3]) },
    fullness: {
      kind: "shoulder",
      shoulder: outline([0, 2], [Math.SQRT2 - 1, Math.SQRT2 - 1]),
    },
  };
  const rings: ReturnType<typeof HumanDebugViewCurves.of> =
    HumanDebugViewCurves.of(observed(middle));
  const ids: string[] = rings.curves.map(
    (curve: IHumanDebugDocument.ICurve): string => curve.id,
  );
  if (
    !ids.includes("human.construction.view.source/top.0") ||
    !ids.includes("human.construction.view.source/top.2") ||
    ids.includes("human.construction.view.source/top.1") ||
    !rings.diagnostics.some((d: AutoMovieLoftContract.IDiagnostic): boolean =>
      d.detail.includes("top.1"),
    )
  )
    failures.push(
      "Missing raw fullness section changed top-ring identity or hid its failure",
    );
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

/** Synthetic named source knots; expectations are analytic, not evaluator snapshots. */
function outline(
  stations: readonly number[],
  values: readonly number[],
): IAutoMovieViewPart.IOutline {
  return {
    knots: stations.map(
      (station: number, i: number): IAutoMovieViewPart.IKnot => ({
        site: "site." + i,
        station,
        value: values[i]!,
      }),
    ),
  };
}

/** Feed the real loft output into the display, including its original diagnostic group. */
function observed(part: IAutoMovieViewPart): HumanDebugViewParts.IOutput {
  const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
  return {
    parts: [{ name: part.name, part, loft }],
    scale: 2,
    observation: {
      stage: "source-definition",
      finalRealization: "not-run",
      treeParts: [],
      studies: [],
      definitionOnlyParts: [part.name],
      unavailableParts: [],
    },
    repeats: {},
    diagnostics: { body: [...loft.diagnostics], head: [] },
    sourceRecords: [],
  };
}

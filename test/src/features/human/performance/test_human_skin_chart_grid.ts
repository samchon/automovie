import type { IAutoMovieLoftChain } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanSkinChartGrid } from "../../../../../packages/human/src/appearance/AutoMovieHumanSkinChartGrid";
import { nclose } from "../../internal/nclose";

/** The ordinary caller-owned result, in chart millimetres. */
type Triple = [number, number, number];

/**
 * Interpolate a literal chart without changing periodic branches or result ownership.
 *
 * Scenarios:
 * 1. Independent two-row bilinear values, exact rows and station clamping.
 * 2. Negative/multiple turns, varying-perimeter cuts and both sides of the positive half-turn tie.
 * 3. Intentional NaN pole means, the existing infinity branch and a collapsed pole row.
 * 4. IEEE left-to-right cancellation, unchanged inputs and independently mutable results.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real Grid.at on a literal four-column chart and checks u/v/perimeter at regular, clamped, wrapped and pole locations. The cancellation case distinguishes the original sum from collecting opposite corners together; mutations of a returned triple must not affect a later query or any grid buffer.
 * @evidence contracts/testing.md#independent-expectations Expected values follow bilinear fractions of the stated 100/120 mm row perimeters, literal quarter-turn u values and a straight meridian rise sqrt(20^2+(5/sqrt(2))^2). The tested positive half-turn tie stays positive. A separate finite cancellation table expects 0.25 by binary64 left association, not by calling a second copy of Grid.at. These questions do not prove grid creation, physical chart accuracy, atlas packing or f1 performance.
 * @evidence contracts/testing.md#distinguishing-cases Covers both station limits and clamping, exact phase knots, negative and repeated turns, row-specific unwrap and final half-perimeter boundaries, intentional NaN poles including zero perimeter, and the legacy nonfinite infinity branch without treating infinity as a geometric pole. Also checks unchanged buffers and fresh mutable triples. Arbitrary malformed grid admission is outside this reader's producer premise.
 * @evidence contracts/testing.md#execution-ownership One discoverable synchronous portable question, test_human_skin_chart_grid, owns all literal numeric cases. It starts no person generation, process, browser or GPU, patches no foreign method and asserts no host-dependent memory or time threshold.
 */
export function test_human_skin_chart_grid(): void {
  /** Two independently stated rows; this question owns interpolation rather than create's resolution. */
  const grid: AutoMovieHumanSkinChartGrid.IGrid = fixture();
  /** The straight meridian between radii differing by 5/sqrt(2) over 20 mm. */
  const rise: number = Math.sqrt(412.5);
  /** Copies used only to check that queries do not mutate their borrowed data. */
  const before: Float64Array[] = [
    grid.u.slice(),
    grid.v.slice(),
    grid.perimeter.slice(),
    grid.points.slice(),
  ];

  check(grid, 20, Math.PI / 4, [13.75, rise / 2 + 2, 110], "bilinear midpoint");
  check(grid, 15, Math.PI / 4, [13.125, rise / 4 + 2, 105], "quarter station");
  check(grid, 10, Math.PI / 2, [25, 4, 100], "lower row knot");
  check(grid, 30, Math.PI / 2, [30, rise + 4, 120], "upper row knot");
  check(grid, -100, Math.PI / 2, [25, 4, 100], "lower clamp");
  check(grid, 100, Math.PI / 2, [30, rise + 4, 120], "upper clamp");
  check(grid, 20, 0, [0, rise / 2, 110], "front");
  check(grid, 20, 2 * Math.PI, [0, rise / 2, 110], "full-turn knot");
  /** Equivalent periodic coordinates retain the same four-corner meaning. */
  for (const phase of [
    -Math.PI / 4,
    (7 * Math.PI) / 4,
    (7 * Math.PI) / 4 + 8 * Math.PI,
  ])
    check(grid, 20, phase, [-13.75, rise / 2 + 6, 110], "periodic wrap");
  check(grid, 20, Math.PI, [55, rise / 2 + 8, 110], "strict half-turn tie");
  check(grid, 20, (7 * Math.PI) / 8, [48.125, rise / 2 + 7, 110], "before cut");
  check(grid, 20, (9 * Math.PI) / 8, [-48.125, rise / 2 + 9, 110], "after cut");
  check(
    grid,
    20,
    (5 * Math.PI) / 4,
    [-41.25, rise / 2 + 10, 110],
    "row-specific unwrap",
  );
  check(grid, 10, NaN, [0, 6, 100], "lower pole marker");
  check(grid, 20, NaN, [0, rise / 2 + 6, 110], "interpolated pole mean");
  check(grid, 30, NaN, [0, rise + 6, 120], "upper pole marker");
  /** Infinities preserve the old nonfinite branch, not a new geometric admission. */
  for (const phase of [-Infinity, Infinity])
    check(grid, 20, phase, [0, rise / 2 + 6, 110], "legacy nonfinite phase");

  /** A zero-perimeter row still has the declared pole meridian mean. */
  const pole: AutoMovieHumanSkinChartGrid.IGrid = fixture();
  pole.u.fill(0, 0, 4);
  pole.perimeter[0] = 0;
  check(pole, 10, NaN, [0, 6, 0], "collapsed pole row");

  /** Finite values stress summation order; this is numerical compatibility, not anthropometry. */
  const cancellation: AutoMovieHumanSkinChartGrid.IGrid = fixture();
  cancellation.u.set([1e16, 1, 0, 0, -1e16, 1, 0, 0]);
  cancellation.v.set([1e16, 1, 0, 0, -1e16, 1, 0, 0]);
  cancellation.perimeter.fill(1e20);
  check(
    cancellation,
    20,
    Math.PI / 4,
    [0.25, 0.25, 1e20],
    "left-associated cancellation",
    0,
  );

  /** Results belong to each caller even when the location repeats. */
  const first: Triple = AutoMovieHumanSkinChartGrid.at(grid, 20, Math.PI / 4);
  /** A second independently mutable result at the same location. */
  const second: Triple = AutoMovieHumanSkinChartGrid.at(grid, 20, Math.PI / 4);
  TestValidator.predicate("fresh result triples", first !== second);
  first.fill(123456);
  same(
    second,
    [13.75, rise / 2 + 2, 110],
    "earlier result remains owned",
    1e-10,
  );
  check(
    grid,
    20,
    Math.PI / 4,
    [13.75, rise / 2 + 2, 110],
    "result mutation is local",
  );
  /** All borrowed buffers, including the unused position data, stay unchanged. */
  const after: readonly Float64Array[] = [
    grid.u,
    grid.v,
    grid.perimeter,
    grid.points,
  ];
  /** Verify values rather than container implementation or a memory threshold. */
  for (let field: number = 0; field < after.length; field++) {
    /** Each original scalar remains present at the same input location. */
    for (let item: number = 0; item < after[field]!.length; item++)
      TestValidator.predicate(
        `unchanged buffer ${field}/${item}`,
        nclose(after[field]![item]!, before[field]![item]!, 0),
      );
  }
}

/** Execute one real query against the independently supplied chart expectation. */
function check(
  grid: AutoMovieHumanSkinChartGrid.IGrid,
  station: number,
  phase: number,
  expected: Triple,
  label: string,
  tolerance: number = 1e-10,
): void {
  same(
    AutoMovieHumanSkinChartGrid.at(grid, station, phase),
    expected,
    label,
    tolerance,
  );
}

/** Compare all finite components without weakening a nonfinite result into equality. */
function same(
  actual: Triple,
  expected: Triple,
  label: string,
  tolerance: number,
): void {
  /** Each component has the same declared mm units and absolute tolerance. */
  for (let component: number = 0; component < 3; component++)
    TestValidator.predicate(
      `${label}/${component}`,
      nclose(actual[component]!, expected[component]!, tolerance),
    );
}

/** A literal coarse chart for the interpolation contract, not a claim about create's phase resolution. */
function fixture(): AutoMovieHumanSkinChartGrid.IGrid {
  /** Cardinal radii whose four-chord row perimeters are 100 and 120 mm. */
  const radii: readonly number[] = [25 / Math.SQRT2, 30 / Math.SQRT2];
  /** The common straight meridian increment between these rows. */
  const rise: number = Math.hypot(20, radii[1]! - radii[0]!);
  /** Constant radial control slope of a valid ordinary four-control spline chain. */
  const slope: number = (1.5 * (radii[1]! - radii[0]!)) / 20;
  /** Opaque geometric owner; at reads the chart tables rather than evaluating this chain. */
  const chain: IAutoMovieLoftChain = {
    name: "chart.scalar-unit",
    basis: "spline",
    order: 4,
    rule: "polar",
    samples: 64,
    layers: radii.map(
      (radius: number, index: number): IAutoMovieLoftChain.ILayer => ({
        y: 10 + 20 * index,
        coefficients: [
          1.5 * radius,
          0,
          -1.5 * radius,
          0,
          0,
          1.5 * radius,
          0,
          -1.5 * radius,
        ],
        slopes: [slope, 0, -slope, 0, 0, slope, 0, -slope],
      }),
    ),
  };
  return {
    chain,
    from: 10,
    step: 20,
    stations: 2,
    phases: 4,
    points: Float64Array.from([
      radii[0]!,
      10,
      0,
      0,
      10,
      radii[0]!,
      -radii[0]!,
      10,
      0,
      0,
      10,
      -radii[0]!,
      radii[1]!,
      30,
      0,
      0,
      30,
      radii[1]!,
      -radii[1]!,
      30,
      0,
      0,
      30,
      -radii[1]!,
    ]),
    u: Float64Array.from([0, 25, 50, -25, 0, 30, 60, -30]),
    v: Float64Array.from([0, 4, 8, 12, rise, rise + 4, rise + 8, rise + 12]),
    perimeter: Float64Array.from([100, 120]),
  };
}

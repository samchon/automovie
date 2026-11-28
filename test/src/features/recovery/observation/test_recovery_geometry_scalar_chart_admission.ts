import {
  AutoMovieRecoveryScalarIndex,
  AutoMovieRecoverySlabGraph,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * Scalar-chart selection distinguishes malformed source data from a valid open
 * slab, a closed endpoint cut and an unsupported source component.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States finite input, integer incidence and query bounds, endpoint rules and local unsupported output.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the exported index and slab graph with finite and malformed source charts and queries. Reads their ordered face IDs and boundary groups.
 * @evidence contracts/development/testing.md#independent-expectations The first face spans [0,2] and the second lies at level one. Closed cuts include both interval ends, and the open slab excludes its ends. One authored open-contour defect makes its component unsupported.
 */
export function test_recovery_geometry_scalar_chart_admission(): void {
  const source: Parameters<typeof AutoMovieRecoverySlabGraph.observe>[0] = {
    triangles: [[0, 1, 2]],
    heights: [0, 1, 2],
    canon: Int32Array.from([0, 1, 2]),
    beforeMm: 0.25,
    afterMm: 1.75,
    before: [new Set([0])],
    after: [new Set([0])],
    defects: [],
  };
  const index = AutoMovieRecoveryScalarIndex.create(
    [...source.triangles, [3, 4, 5]],
    [...source.heights, 1, 1, 1],
  );
  TestValidator.equals(
    "closed endpoints and open overlap preserve original face order",
    [
      index.cut(0),
      index.cut(1),
      index.cut(2),
      index.cut(100),
      index.slab(0, 1),
      index.slab(0, 2),
    ],
    [[0], [0, 1], [0], [], [0], [0, 1]],
  );
  TestValidator.equals(
    "the valid face connects both source ports",
    AutoMovieRecoverySlabGraph.observe(source),
    [{ before: [0], after: [0], supported: true, reason: null }],
  );
  TestValidator.equals(
    "declared source defects stay observable without admitting malformed input",
    AutoMovieRecoverySlabGraph.observe({ ...source, defects: [new Set([0])] }),
    [
      {
        before: [0],
        after: [0],
        supported: false,
        reason:
          "Open, isolated or unrepresented source contour in this slab component",
      },
    ],
  );

  const sparseHeights: number[] = [0, 1, 2];
  delete sparseHeights[1];
  const malformedAddress: [number, number, number][] = [[0, 0.5, 2]];
  const witnesses: [string, () => unknown, string][] = [
    [
      "index accepts NaN height",
      () => AutoMovieRecoveryScalarIndex.create(source.triangles, [0, NaN, 2]),
      "Finite scalar heights are required",
    ],
    [
      "index accepts sparse height",
      () =>
        AutoMovieRecoveryScalarIndex.create(source.triangles, sparseHeights),
      "Finite scalar heights are required",
    ],
    [
      "index accepts fractional address",
      () =>
        AutoMovieRecoveryScalarIndex.create(malformedAddress, source.heights),
      "Face addresses do not align with scalar heights",
    ],
    [
      "closed cut accepts NaN bound",
      () => index.cut(NaN),
      "Finite ordered scalar query required",
    ],
    [
      "index slab accepts infinite bounds",
      () => index.slab(-Infinity, Infinity),
      "Finite ordered scalar query required",
    ],
    [
      "slab accepts NaN height",
      () =>
        AutoMovieRecoverySlabGraph.observe({ ...source, heights: [0, NaN, 2] }),
      "A finite aligned scalar chart is required",
    ],
    [
      "slab accepts sparse height",
      () =>
        AutoMovieRecoverySlabGraph.observe({
          ...source,
          heights: sparseHeights,
        }),
      "A finite aligned scalar chart is required",
    ],
    [
      "slab accepts fractional source address",
      () =>
        AutoMovieRecoverySlabGraph.observe({
          ...source,
          triangles: malformedAddress,
        }),
      "Slab triangle addresses do not align with the scalar chart",
    ],
    [
      "slab accepts infinite bounds",
      () =>
        AutoMovieRecoverySlabGraph.observe({
          ...source,
          beforeMm: -Infinity,
          afterMm: Infinity,
        }),
      "Finite increasing slab bounds are required",
    ],
    [
      "slab accepts a fractional candidate",
      () =>
        AutoMovieRecoverySlabGraph.observe({ ...source, candidates: [0.5] }),
      "Slab candidates must be increasing original face addresses",
    ],
    [
      "slab accepts a fractional support",
      () =>
        AutoMovieRecoverySlabGraph.observe({
          ...source,
          before: [new Set([0.5])],
        }),
      "Slab boundary support contains an invalid source face",
    ],
  ];
  const unexpected: object[] = [];
  for (const [witness, run, expected] of witnesses)
    try {
      unexpected.push({ witness, result: run() });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== expected)
        unexpected.push({ witness, error: String(error) });
    }
  TestValidator.equals(
    "all malformed inputs fail at their owner",
    unexpected,
    [],
  );
}

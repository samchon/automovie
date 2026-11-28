import type {
  IAutoMovieRecoveryOpenContinuation,
  IAutoMovieRecoveryOpenSlabGraph,
} from "@automovie/interface";
import {
  AutoMovieRecoveryBezierFit,
  AutoMovieRecoveryOpenContinuation,
  AutoMovieRecoveryOpenRun,
  AutoMovieRecoveryOpenSlabGraph,
  AutoMovieRecoveryReconstruction,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";
import { recoveryPrismOracle } from "../../internal/recoveryPrismOracle";

/**
 * Checks shared adjacency admission while retaining distinct open-run
 * consumers.
 *
 * Scenarios:
 *
 * 1. Two saved open straight lines support one adjacent pair and one run.
 * 2. Omitting the saved interval refuses both planning and reconstruction.
 * 3. An unqualified slab preserves the same observed graph through both public
 *    preparation names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies a valid pair, missing complete incidence and an unqualified slab.
 * @evidence contracts/development/testing.md#behavioral-verification Calls both planners and source-free reconstruction on a typed two-station sidecar. The independent slab probe compares public preparation results.
 * @evidence contracts/development/testing.md#independent-expectations Exactly two saved stations require one sidecar interval. Each has one open arc, so its only qualified edge starts at 0:0 and ends at 1:0. A slab with no observed endpoint arcs cannot report an ordinary pair.
 */
export function test_recovery_reconstruction_open_continuation(): void {
  const bundle: recoveryPrismOracle.Input =
    recoveryPrismOracle.makeInput(false);
  for (const report of bundle.reports) {
    const y: number = report.coordinateMm;
    report.open.push(
      AutoMovieRecoveryBezierFit.fit({
        name: `line.${y}`,
        pointsMm: [
          [6, y, 0],
          [9, y, 0],
        ],
        closed: false,
        corners: [],
        toleranceMm: 0.05,
        maxSpans: 1,
        parameterization: "chord",
      }),
    );
  }
  const graph: IAutoMovieRecoveryOpenContinuation = {
    criticalPolicy: "boundary-regular-path-v1",
    intervals: [
      {
        beforeSection: 0,
        afterSection: 1,
        pairs: [{ before: 0, after: 0, reverseAfter: false }],
        unresolved: [],
      },
    ],
    orientations: [[1], [1]],
    diagnostics: [],
    resolutionMm: 0.5,
    maxVerticesPerRun: 1024,
  };
  const analytic = AutoMovieRecoveryReconstruction.realizeAnalyticDomains(
    bundle,
    graph,
  );
  const local = AutoMovieRecoveryOpenRun.prepareLocalContinuation(
    bundle,
    graph,
    analytic,
  );
  const runs = AutoMovieRecoveryOpenRun.prepareOpenRuns(bundle, graph, "ruled");
  const edge = {
    before: { section: 0, arc: 0 },
    after: { section: 1, arc: 0 },
    pairOrdinal: 0,
    reverse: false,
  };
  TestValidator.equals(
    "matching pair direction and identity",
    [local.outgoing.get("0:0"), runs.incoming.get("1:0")],
    [edge, edge],
  );
  TestValidator.equals(
    "one generated source-free run",
    AutoMovieRecoveryOpenRun.reconstructOpen(bundle, graph).openReports
      .generatedRuns,
    1,
  );

  const incomplete: IAutoMovieRecoveryOpenContinuation = {
    ...graph,
    intervals: [],
  };
  const readers: [string, () => unknown][] = [
    [
      "local",
      (): unknown =>
        AutoMovieRecoveryOpenRun.prepareLocalContinuation(
          bundle,
          incomplete,
          analytic,
        ),
    ],
    [
      "planned",
      (): unknown =>
        AutoMovieRecoveryOpenRun.prepareOpenRuns(bundle, incomplete, "ruled"),
    ],
    [
      "reconstructed",
      (): unknown =>
        AutoMovieRecoveryOpenRun.reconstructOpen(bundle, incomplete),
    ],
  ];
  TestValidator.equals(
    "each reader diagnoses a missing adjacent interval",
    readers
      .filter(
        ([, read]) =>
          !throwsError(read, "complete source-free open-continuation sidecar"),
      )
      .map(([name]) => name),
    [],
  );

  const source: IAutoMovieRecoveryOpenSlabGraph.Source = {
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 2, 0],
      [0, 2, 0],
    ],
    triangles: [
      [0, 1, 2],
      [0, 2, 3],
    ],
    canon: Int32Array.of(0, 1, 2, 3),
    heights: [0, 0, 2, 2],
  };
  const query: IAutoMovieRecoveryOpenSlabGraph.Query = {
    beforeMm: 0.5,
    afterMm: 1.5,
    before: [],
    after: [],
    defects: [],
    candidates: [0, 1],
  };
  const observed: IAutoMovieRecoveryOpenSlabGraph.Result =
    AutoMovieRecoveryOpenSlabGraph.prepare(source)(query);
  TestValidator.equals(
    "no ordinary pair without classified endpoint arcs",
    observed.pairs,
    [],
  );
  TestValidator.equals(
    "both public preparations preserve the graph",
    AutoMovieRecoveryOpenContinuation.prepareSlabGraph(source)(query),
    observed,
  );
}

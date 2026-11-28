import type { IAutoMovieRecoveryChartBatch } from "@automovie/interface";
import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A chart batch distinguishes network refusal, local fit refusal and fitted
 * receipts. A malformed sibling can leave an isolated fit with no shared
 * boundary qualification.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States all three chart outcomes and separates shared-boundary qualification from a retained fit.
 * @evidence contracts/development/testing.md#behavioral-verification Drives the exported chart generator with a finite planar chart, a malformed sibling and an otherwise valid chart with no allowed fit patches.
 * @evidence contracts/development/testing.md#independent-expectations Two 4 by 4 right-triangle halves cover sixteen square millimetres. Missing boundary keys block registration, while a zero patch cap fails the separate fit stage.
 */
export function test_recovery_observation_chart_batch_states(): void {
  const square: IAutoMovieRecoveryChartBatch.IInput["charts"][number] = {
    name: "planar-disk",
    verticesMm: [
      [0, 0, 0],
      [4, 0, 0],
      [4, 4, 0],
      [0, 4, 0],
    ],
    triangles: [
      [0, 1, 2],
      [0, 2, 3],
    ],
    physicalKeys: ["a", "b", "c", "d"],
    sides: [
      [0, 1],
      [1, 2],
      [3, 2],
      [0, 3],
    ],
    insertions: [],
  };
  const policy: IAutoMovieRecoveryChartBatch.IInput["fit"] = {
    toleranceMm: 0.01,
    maxSpans: 16,
    cornerDegrees: 45,
    maxPatches: 64,
    maxIterations: 1000,
  };
  const run = (
    charts: IAutoMovieRecoveryChartBatch.IInput["charts"],
    fit: IAutoMovieRecoveryChartBatch.IInput["fit"] = policy,
  ): IAutoMovieRecoveryChartBatch.IResult[] => [
    ...AutoMovieRecoveryObservation.assembleChartBatch({
      charts,
      fit,
      owner: AutoMovieRecoveryObservation.createChartBoundary(policy),
    }),
  ];
  const [valid] = run([square]);
  const [fitRefused] = run([square], { ...policy, maxPatches: 0 });
  const [networkRefused, independent] = run([
    { ...square, name: "missing-keys", physicalKeys: ["a", "b"] },
    square,
  ]);
  TestValidator.equals(
    "geometric and admission witnesses reach distinct states",
    [valid?.type, fitRefused?.type, networkRefused?.type, independent?.type],
    ["fitted", "chart-fit-refused", "boundary-network-refused", "fitted"],
  );
  TestValidator.predicate(
    "a fitted planar chart reports measured area and successful network work",
    valid?.type === "fitted" &&
      valid.reason === null &&
      valid.sharedBoundaryQualified &&
      valid.fit.patches.length > 0 &&
      nclose(valid.fit.areaObservation.sourceAreaMm2 ?? NaN, 16),
  );
  TestValidator.predicate(
    "local fit refusal keeps the network's chart and its independent qualification",
    fitRefused?.type === "chart-fit-refused" &&
      fitRefused.chart.name === square.name &&
      fitRefused.fit === null &&
      fitRefused.sharedBoundaryQualified &&
      fitRefused.reason.startsWith("chart-map-or-fit: "),
  );
  TestValidator.predicate(
    "network refusal and an independently fitted sibling preserve their evidence",
    networkRefused?.type === "boundary-network-refused" &&
      networkRefused.chart === null &&
      networkRefused.fit === null &&
      !networkRefused.sharedBoundaryQualified &&
      networkRefused.reason.startsWith("boundary-network: ") &&
      independent?.type === "fitted" &&
      !independent.sharedBoundaryQualified &&
      independent.fit.patches.length > 0,
  );
}

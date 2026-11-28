import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryDiskChart,
} from "@automovie/interface";
import {
  AutoMovieRecoveryObservation,
  AutoMovieRecoveryShape,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * Checks face admission in inferred- and supplied-boundary Recovery charts.
 *
 * Scenarios:
 *
 * 1. A 3-4-5 triangle gives one ordered cycle and area six square millimetres.
 * 2. Finite input can still overflow the physical triangle area. Both chart paths
 *    refuse it at geometry admission.
 * 3. A fractional vertex address is rejected before indexing an array.
 * 4. A supplied square keeps its four sides and exposes the disk's distinct
 *    refusal diagnostics for overflow and an invalid address.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the finite reference triangle and contrasts area overflow with an invalid address.
 * @evidence contracts/development/testing.md#behavioral-verification Calls multi-boundary and feature topology admission on the same triangle. A square exercises disk chart sides. The test reads measured area, winding and refusal diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations The 3-4 right triangle has area six and positive z winding. A square perimeter divides at the existing four corners. Fractional indices have no vertex address and 1e155 lengths overflow their cross product.
 */
export function test_recovery_observation_chart_face_admission(): void {
  const fail = (reason: string): never => {
    throw new Error(reason);
  };
  const edge = (a: number, b: number): string =>
    a < b ? `${a}:${b}` : `${b}:${a}`;
  const feature = AutoMovieRecoveryObservation.inspectFeatureChartTopology(
    fail,
    edge,
  );
  const inputs: AutoMovieVector3Tuple[] = [
    [0, 0, 0],
    [4, 0, 0],
    [0, 3, 0],
  ];
  const triangle: [number, number, number][] = [[0, 1, 2]];
  const validMulti = AutoMovieRecoveryShape.analyzeMultiBoundarySurface(
    inputs,
    triangle,
    fail,
    edge,
  );
  const validFeature = feature(inputs, triangle);
  TestValidator.equals("multi-boundary cycle", validMulti.cycles, [[0, 1, 2]]);
  TestValidator.equals("feature cycle", validFeature.cycles, [[0, 1, 2]]);
  TestValidator.predicate(
    "six square millimetres with positive z winding",
    nclose(validMulti.areaMm2, 6) &&
      nclose(validFeature.areas[0]!, 6) &&
      nclose(validFeature.normals[0]![2], 1),
  );
  const disk: IAutoMovieRecoveryDiskChart.Input = {
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
    vertexKeys: ["a", "b", "c", "d"],
    boundaryCycle: [0, 1, 2, 3],
    cornerDegrees: 45,
  };
  const validDisk: IAutoMovieRecoveryDiskChart.Result =
    AutoMovieRecoveryObservation.prepareDiskChart(disk);
  TestValidator.equals(
    "supplied disk retains its four sides",
    validDisk.sides,
    [
      [0, 1],
      [1, 2],
      [3, 2],
      [0, 3],
    ],
  );
  TestValidator.predicate(
    "sixteen-millimetre disk perimeter",
    nclose(validDisk.cornerRule.perimeterMm, 16),
  );

  const overflow: AutoMovieVector3Tuple[] = [
    [0, 0, 0],
    [1e155, 0, 0],
    [0, 1e155, 0],
  ];
  const fractional: [number, number, number][] = [[0, 1, 1.5]];
  const malformed: [string, () => unknown, string][] = [
    [
      "multi overflow",
      (): unknown =>
        AutoMovieRecoveryShape.analyzeMultiBoundarySurface(
          overflow,
          triangle,
          fail,
          edge,
        ),
      "unrepresentable",
    ],
    [
      "feature overflow",
      (): unknown => feature(overflow, triangle),
      "unrepresentable",
    ],
    [
      "multi index",
      (): unknown =>
        AutoMovieRecoveryShape.analyzeMultiBoundarySurface(
          inputs,
          fractional,
          fail,
          edge,
        ),
      "triangle addresses are invalid",
    ],
    [
      "feature index",
      (): unknown => feature(inputs, fractional),
      "triangle addresses are invalid",
    ],
  ];
  TestValidator.equals(
    "both chart routes refuse each unrepresentable face at admission",
    malformed
      .filter(([, call, reason]) => !throwsError(call, reason))
      .map(([name]) => name),
    [],
  );
  TestValidator.predicate(
    "disk keeps its own geometry and address diagnostics",
    throwsError(
      (): unknown =>
        AutoMovieRecoveryObservation.prepareDiskChart({
          ...disk,
          verticesMm: [
            [0, 0, 0],
            [1e155, 0, 0],
            [1e155, 1e155, 0],
            [0, 1e155, 0],
          ],
        }),
      "Unsupported disk chart: a private triangle is degenerate or its normal is unrepresentable",
    ) &&
      throwsError(
        (): unknown =>
          AutoMovieRecoveryObservation.prepareDiskChart({
            ...disk,
            triangles: [
              [0, 1, 1.5],
              [0, 2, 3],
            ],
          }),
        "Unsupported disk chart: private triangle addresses are invalid",
      ),
  );
}

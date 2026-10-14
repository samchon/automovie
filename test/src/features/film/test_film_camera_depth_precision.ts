import { evaluateAutoMovieCameraDepthPrecision } from "@automovie/engine";
import type { IAutoMovieCameraDepthPrecisionConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const CONSTRAINT: IAutoMovieCameraDepthPrecisionConstraint = {
  minimumDepthBits: 8,
  maximumStepMeters: 20,
};

const evaluate: (overrides?: Partial<Parameters<typeof evaluateAutoMovieCameraDepthPrecision>[0]>) => ReturnType<typeof evaluateAutoMovieCameraDepthPrecision> = (
  overrides: Partial<
    Parameters<typeof evaluateAutoMovieCameraDepthPrecision>[0]
  > = {},
): ReturnType<typeof evaluateAutoMovieCameraDepthPrecision> =>
  evaluateAutoMovieCameraDepthPrecision({
    camera: "camera-main",
    time: 1.25,
    near: 1,
    far: 101,
    requiredNear: 2,
    requiredFar: 50,
    constraint: CONSTRAINT,
    ...overrides,
  });

/**
 * Standard fixed-point depth precision reports an addressed far-end cell.
 *
 * Scenarios:
 *
 * 1. An eight-bit 1..101 clip range reports codes 252/253 and the independently
 *    computed 10.198990198990188 metre gap at required far depth 50.
 * 2. Equality with the measured step passes; halving that maximum fails.
 * 3. Either required endpoint outside the clip range is refused.
 * 4. A million-to-one clip ratio exposes a coarse far-end step at 24 bits.
 * 5. Sixteen malformed or unmeasurable inputs report invalid status and null
 *    code/step measurements, and serialize with null fields.
 * 6. A required point on the near plane has codes 0/0 and zero step.
 * 7. Repeated input preserves the report; camera and time remain addressed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls evaluateAutoMovieCameraDepthPrecision with valid, threshold, clipping, extreme-ratio, malformed, and degenerate-near inputs, checking codes, measured metres, statuses, null measurements, and addressing.
 * @evidence contracts/testing.md#independent-expectations For levels 255 and near/far 1/101, inverse perspective depths at codes 252 and 253 are 25755/555 and 25755/455; their difference supplies the fixed step oracle. The extreme-ratio literal independently anchors a second scale, while the inclusive-boundary pair reuses the already anchored measurement only as a threshold input.
 * @evidence contracts/testing.md#distinguishing-cases Exact versus halved thresholds distinguish inclusive satisfaction from insufficient precision; each clipped endpoint fails separately, malformed scalars and unsafe/unmeasurable depth ranges stay invalid, and near-plane point ownership prevents borrowing a preceding cell.
 * @evidence contracts/testing.md#execution-ownership Runs a synchronous mathematical report builder on local records without rendering, a real depth buffer, resource access, clocks, or dependency replacement. Existing test12ValuesClose preserves exact-copy report structure and numeric components; serialization is observed separately for invalid reports.
 */
export function test_film_camera_depth_precision(): void {
  const valid: ReturnType<typeof evaluate> = evaluate();
  TestValidator.equals(
    "hand-computable far-end cell is reported in metres",
    namedFacts([
      ["passed", (): boolean => valid.passed],
      ["status", (): boolean => valid.status === "satisfied"],
      ["codes", (): boolean => valid.lowerCode === 252 && valid.upperCode === 253],
      [
        "step",
        (): boolean =>
          valid.measuredStepMeters !== null &&
          nclose(valid.measuredStepMeters, 10.198990198990188, 1e-12),
      ],
      ["metric", (): boolean => valid.metric === "maximum-adjacent-depth-step"],
      ["unit", (): boolean => valid.unit === "meters"],
    ]),
    {
      passed: true,
      status: true,
      codes: true,
      step: true,
      metric: true,
      unit: true,
    },
  );

  const exact: ReturnType<typeof evaluate> = evaluate({
    constraint: {
      ...CONSTRAINT,
      maximumStepMeters: valid.measuredStepMeters!,
    },
  });
  const below: ReturnType<typeof evaluate> = evaluate({
    constraint: {
      ...CONSTRAINT,
      maximumStepMeters: valid.measuredStepMeters! / 2,
    },
  });
  TestValidator.equals(
    "exact threshold passes and the precision negative twin fails",
    [exact.status, exact.passed, below.status, below.passed],
    ["satisfied", true, "insufficient-precision", false],
  );

  const outsideNear: ReturnType<typeof evaluate> = evaluate({ requiredNear: 0.5 });
  const outsideFar: ReturnType<typeof evaluate> = evaluate({ requiredFar: 102 });
  TestValidator.equals(
    "either required-range edge outside the clip range is refused",
    [outsideNear.status, outsideFar.status],
    ["outside-clipping-range", "outside-clipping-range"],
  );

  const extreme: ReturnType<typeof evaluate> = evaluate({
    near: 1,
    far: 1_000_000,
    requiredNear: 2,
    requiredFar: 1_000_000,
    constraint: { minimumDepthBits: 24, maximumStepMeters: 1000 },
  });
  TestValidator.predicate(
    "extreme far-to-near ratio exposes its coarse far-end step",
    extreme.status === "insufficient-precision" &&
      extreme.measuredStepMeters !== null &&
      nclose(extreme.measuredStepMeters, 56251.727617006865, 1e-6),
  );

  const invalid: ReturnType<typeof evaluate>[] = [
    evaluate({ camera: " " }),
    evaluate({ time: Number.NaN }),
    evaluate({ time: -1 }),
    evaluate({ near: Number.NaN }),
    evaluate({ near: 0 }),
    evaluate({ far: Number.POSITIVE_INFINITY }),
    evaluate({ far: 1 }),
    evaluate({ requiredNear: Number.NaN }),
    evaluate({ requiredFar: Number.NEGATIVE_INFINITY }),
    evaluate({ requiredNear: 51, requiredFar: 50 }),
    evaluate({ constraint: { ...CONSTRAINT, minimumDepthBits: 1.5 } }),
    evaluate({ constraint: { ...CONSTRAINT, minimumDepthBits: 0 } }),
    evaluate({ constraint: { ...CONSTRAINT, minimumDepthBits: 54 } }),
    evaluate({
      constraint: { ...CONSTRAINT, maximumStepMeters: Number.NaN },
    }),
    evaluate({ constraint: { ...CONSTRAINT, maximumStepMeters: 0 } }),
    evaluate({
      near: Number.MIN_VALUE,
      far: 1,
      requiredNear: 1,
      requiredFar: 1,
      constraint: { minimumDepthBits: 53, maximumStepMeters: 1 },
    }),
  ];
  TestValidator.predicate(
    "malformed and numerically unmeasurable inputs return serializable invalid reports",
    invalid.every(
      (report: ReturnType<typeof evaluate>): boolean =>
        report.status === "invalid" &&
        report.passed === false &&
        report.lowerCode === null &&
        report.upperCode === null &&
        report.measuredStepMeters === null,
    ) && invalid.every((report: ReturnType<typeof evaluate>): boolean => JSON.stringify(report).includes("null")),
  );

  const nearPoint: ReturnType<typeof evaluate> = evaluate({ requiredNear: 1, requiredFar: 1 });
  TestValidator.equals(
    "a degenerate required point exactly on near owns no preceding cell",
    [nearPoint.lowerCode, nearPoint.upperCode, nearPoint.measuredStepMeters !== null && nclose(nearPoint.measuredStepMeters, 0)],
    [0, 0, true],
  );

  TestValidator.equals(
    "same input is structurally stable while camera and time remain addressed",
    namedFacts([
      ["same", (): boolean => test12ValuesClose(valid, evaluate())],
      [
        "camera",
        (): boolean => evaluate({ camera: "alternate" }).camera === "alternate",
      ],
      ["time", (): boolean => nclose(evaluate({ time: 2 }).time ?? Number.NaN, 2)],
    ]),
    { same: true, camera: true, time: true },
  );
}

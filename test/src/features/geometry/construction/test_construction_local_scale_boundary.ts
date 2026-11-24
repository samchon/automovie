import { AutoMovieConstructionLocalScaleMinorant as Minorant } from "@automovie/engine";
import type { IAutoMovieConstructionLocalScaleMinorant } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * One guarded attenuation either satisfies every literal certificate or
 * refuses.
 *
 * Scenarios:
 *
 * 1. Already-admitted and exactly-on-cap fields retain every value with alpha 1. A
 *    dyadic violation uses the independently known predecessor of 1/2 and
 *    preserves the same multiplier at forward and backward columns.
 * 2. Original-factor and final-candidate certificates can refuse separately. A
 *    stricter finite log obstacle is honored, and no second candidate is
 *    tried.
 * 3. Malformed inputs, a zero predecessor and multiplication to zero refuse at
 *    their owning stage. A positive subnormal that satisfies every supplied
 *    certificate remains admissible. Every invocation preserves its inputs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real scalar owner and records its actual supplied certificate calls, accepted values and named refusal stages; all cases are inspected before one assertion.
 * @evidence contracts/development/testing.md#independent-expectations IEEE binary64 has predecessor(1/2)=1/2-2^-54, whose products by 1/2 and 1/4 are exact dyadics. MIN_VALUE has predecessor zero, and multiplying MIN_VALUE by a value below 2^-1022 rounds to zero. Callback inequalities are explicit inputs, not a replacement for the engine geometry predicate. With 0<F<v<=1 a violated ratio cannot overflow or round to zero, so those defensive branches are not forced with an invalid arithmetic shim.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers identity, a cap boundary, tied limiting columns, backward-field scaling, both certificate stages, a finite log failure, malformed field/cap/index/log inputs, positive subnormal acceptance and the two distinct zero-underflow failures. The actual strip's analytic degree-five geometry and its normal counterpart belong to test_construction_local_scale_minorant.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable in-process numeric test owns every explicit field, constraint and pure callback. It loads no Human, host, surface evaluator or asset and replaces no globals or foreign methods.
 * @evidence contracts/development/common.md#meaningful-documentation Gives exact binary expectations, certificate-stage ownership, failure limits and input immutability.
 */
export function test_construction_local_scale_boundary(): void {
  const failures: string[] = [];

  /** Actual calls to the test-owned certificate seam, in invocation order. */
  type Call = { index: number; factor: number; forward: boolean };

  /** A completed scalar invocation, including any collected unexpected throw. */
  type Run = {
    result: IAutoMovieConstructionLocalScaleMinorant.Result | undefined;
    calls: Call[];
  };

  /** Exercise the scalar contract and collect input mutation on every path. */
  const run: (
    label: string,
    values: readonly number[],
    caps: readonly IAutoMovieConstructionLocalScaleMinorant.ICap[],
    certificate?: IAutoMovieConstructionLocalScaleMinorant.Certify,
  ) => Run = (
    label: string,
    values: readonly number[],
    caps: readonly IAutoMovieConstructionLocalScaleMinorant.ICap[],
    certificate: IAutoMovieConstructionLocalScaleMinorant.Certify = ():
      | string
      | null => null,
  ): Run => {
    const beforeValues: number[] = [...values];
    const beforeCaps: IAutoMovieConstructionLocalScaleMinorant.ICap[] =
      caps.map(
        (
          cap: IAutoMovieConstructionLocalScaleMinorant.ICap,
        ): IAutoMovieConstructionLocalScaleMinorant.ICap => ({ ...cap }),
      );
    const calls: Call[] = [];
    let result: IAutoMovieConstructionLocalScaleMinorant.Result | undefined =
      undefined;
    try {
      result = Minorant.create(
        values,
        caps,
        (index: number, factor: number, forward: boolean): string | null => {
          calls.push({ index, factor, forward });
          return certificate(index, factor, forward);
        },
      );
    } catch (error) {
      failures.push(label + ": threw " + String(error));
    }
    if (
      values.length !== beforeValues.length ||
      !values.every((value: number, index: number): boolean =>
        Object.is(value, beforeValues[index]),
      )
    )
      failures.push(label + ": changed the input field");
    if (
      caps.length !== beforeCaps.length ||
      !caps.every(
        (
          cap: IAutoMovieConstructionLocalScaleMinorant.ICap,
          index: number,
        ): boolean =>
          Object.is(cap.index, beforeCaps[index]!.index) &&
          Object.is(cap.factor, beforeCaps[index]!.factor) &&
          Object.is(cap.logarithm, beforeCaps[index]!.logarithm),
      )
    )
      failures.push(label + ": changed the input constraints");
    return { result, calls };
  };

  /** Require the exact failure owner and bounded certificate-call count. */
  const refused: (
    label: string,
    actual: Run,
    stage: Extract<
      IAutoMovieConstructionLocalScaleMinorant.Result,
      { kind: "refused" }
    >["stage"],
    index: number | null,
    calls: number,
    reason?: string,
  ) => void = (
    label: string,
    actual: Run,
    stage: Extract<
      IAutoMovieConstructionLocalScaleMinorant.Result,
      { kind: "refused" }
    >["stage"],
    index: number | null,
    calls: number,
    reason?: string,
  ): void => {
    if (actual.result?.kind !== "refused")
      failures.push(label + ": expected refusal at " + stage);
    else if (
      actual.result.stage !== stage ||
      actual.result.index !== index ||
      actual.result.reason.length === 0 ||
      (reason !== undefined && actual.result.reason !== reason)
    )
      failures.push(label + ": wrong refusal " + JSON.stringify(actual.result));
    if (actual.calls.length !== calls)
      failures.push(label + ": extra or missing certificate attempt");
  };

  /** Require exact dyadic output, without a tolerance hiding an extra ULP. */
  const accepted: (
    label: string,
    actual: Run,
    alpha: number,
    field: readonly number[],
    limiting: readonly number[],
    calls: number,
  ) => void = (
    label: string,
    actual: Run,
    alpha: number,
    field: readonly number[],
    limiting: readonly number[],
    calls: number,
  ): void => {
    if (actual.result?.kind !== "accepted")
      failures.push(
        label + ": expected acceptance " + JSON.stringify(actual.result),
      );
    else {
      if (
        !nclose(actual.result.alpha, alpha, 0) ||
        actual.result.field.length !== field.length ||
        !actual.result.field.every((value: number, index: number): boolean =>
          nclose(value, field[index]!, 0),
        )
      )
        failures.push(label + ": changed the exact scalar result");
      if (
        actual.result.limitingIndices.length !== limiting.length ||
        !limiting.every(
          (index: number): boolean =>
            actual.result?.kind === "accepted" &&
            actual.result.limitingIndices.includes(index),
        )
      )
        failures.push(label + ": wrong limiting columns");
    }
    if (actual.calls.length !== calls)
      failures.push(label + ": extra or missing certificate attempt");
  };

  // The cap order differs from field order; indices, not array position,
  // determine forward ownership and each existing logarithmic constraint.
  const normal: Run = run(
    "normal",
    [1 / 2, 1 / 4],
    [
      { index: 1, factor: 1 / 2, logarithm: Math.log(1 / 2) },
      { index: 0, factor: 3 / 4, logarithm: Math.log(3 / 4) },
    ],
  );
  accepted("normal", normal, 1, [1 / 2, 1 / 4], [], 4);
  accepted(
    "on-cap",
    run(
      "on-cap",
      [1 / 2],
      [{ index: 0, factor: 1 / 2, logarithm: Math.log(1 / 2) }],
    ),
    1,
    [1 / 2],
    [],
    2,
  );

  // Below 1/2 the binary64 spacing is 2^-54. Scaling those exact
  // numbers by powers of two introduces no rounding or copied output.
  const alpha: number = 1 / 2 - 2 ** -54;
  const dyadic: Run = run(
    "dyadic",
    [1, 1 / 2, 1 / 4],
    [
      { index: 0, factor: 1 / 2, logarithm: Math.log(1 / 2) },
      { index: 1, factor: 1, logarithm: 0 },
    ],
  );
  accepted(
    "dyadic",
    dyadic,
    alpha,
    [alpha, 1 / 4 - 2 ** -55, 1 / 8 - 2 ** -56],
    [0],
    5,
  );
  if (
    dyadic.calls.length === 5 &&
    (!dyadic.calls.slice(0, 4).every((call: Call): boolean => call.forward) ||
      dyadic.calls[4]!.index !== 2 ||
      dyadic.calls[4]!.forward)
  )
    failures.push(
      "dyadic: backward column lost final-only certificate ownership",
    );
  const tied: Run = run(
    "tied",
    [1, 1 / 2],
    [
      { index: 0, factor: 1 / 2, logarithm: Math.log(1 / 2) },
      { index: 1, factor: 1 / 4, logarithm: Math.log(1 / 4) },
    ],
  );
  accepted("tied", tied, alpha, [alpha, 1 / 4 - 2 ** -55], [0, 1], 4);

  const heldReason: string = "analytic certificate requires factor <= 1/4";
  const held: Run = run(
    "held-refusal",
    [1 / 4],
    [{ index: 0, factor: 1 / 2, logarithm: Math.log(1 / 2) }],
    (_: number, factor: number, _forward: boolean): string | null =>
      factor <= 1 / 4 ? null : heldReason,
  );
  refused("held-refusal", held, "held-certificate", 0, 1, heldReason);
  const finalReason: string = "literal certificate requires factor >= 1/2";
  const final: Run = run(
    "final-refusal",
    [1],
    [{ index: 0, factor: 1 / 2, logarithm: Math.log(1 / 2) }],
    (_: number, factor: number, _forward: boolean): string | null =>
      factor >= 1 / 2 ? null : finalReason,
  );
  refused("final-refusal", final, "candidate-certificate", 0, 2, finalReason);
  const backwardReason: string =
    "the supplied backward vector certificate refused";
  refused(
    "backward-refusal",
    run(
      "backward-refusal",
      [1, 1 / 2],
      [{ index: 0, factor: 1 / 2, logarithm: Math.log(1 / 2) }],
      (_: number, _factor: number, forward: boolean): string | null =>
        forward ? null : backwardReason,
    ),
    "candidate-certificate",
    1,
    3,
    backwardReason,
  );
  refused(
    "log-refusal",
    run(
      "log-refusal",
      [1 / 2],
      [{ index: 0, factor: 1 / 2, logarithm: Math.log(1 / 4) }],
    ),
    "candidate-log",
    0,
    1,
  );

  // These distinguish a zero attenuation candidate from a positive candidate
  // whose multiplication loses another column. Neither may trigger a retry.
  refused(
    "zero-alpha",
    run(
      "zero-alpha",
      [1],
      [
        {
          index: 0,
          factor: Number.MIN_VALUE,
          logarithm: Math.log(Number.MIN_VALUE),
        },
      ],
    ),
    "alpha",
    null,
    1,
  );
  refused(
    "zero-product",
    run(
      "zero-product",
      [1, Number.MIN_VALUE],
      [{ index: 0, factor: 2 ** -1022, logarithm: Math.log(2 ** -1022) }],
    ),
    "candidate-field",
    1,
    1,
  );
  accepted(
    "positive-subnormal",
    run(
      "positive-subnormal",
      [Number.MIN_VALUE],
      [
        {
          index: 0,
          factor: Number.MIN_VALUE,
          logarithm: Math.log(Number.MIN_VALUE),
        },
      ],
    ),
    1,
    [Number.MIN_VALUE],
    [],
    2,
  );

  refused(
    "empty-field",
    run("empty-field", [], [{ index: 0, factor: 1, logarithm: 0 }]),
    "input-field",
    null,
    0,
  );
  refused("empty-caps", run("empty-caps", [1], []), "input-cap", null, 0);
  for (const value of [0, -1, 2]) {
    const label: string = "invalid-field-" + String(value);
    refused(
      label,
      run(label, [value], [{ index: 0, factor: 1, logarithm: 0 }]),
      "input-field",
      0,
      0,
    );
  }
  for (const factor of [0, -1, 2]) {
    const label: string = "invalid-cap-" + String(factor);
    refused(
      label,
      run(label, [1], [{ index: 0, factor, logarithm: 0 }]),
      "input-cap",
      0,
      0,
    );
  }
  for (const logarithm of [Number.MIN_VALUE]) {
    const label: string = "invalid-log-" + String(logarithm);
    refused(
      label,
      run(label, [1], [{ index: 0, factor: 1, logarithm }]),
      "input-cap",
      0,
      0,
    );
  }
  for (const index of [-1, 1]) {
    const label: string = "invalid-index-" + String(index);
    refused(
      label,
      run(label, [1], [{ index, factor: 1, logarithm: 0 }]),
      "input-cap",
      null,
      0,
    );
  }
  refused(
    "duplicate-index",
    run(
      "duplicate-index",
      [1],
      [
        { index: 0, factor: 1, logarithm: 0 },
        { index: 0, factor: 1, logarithm: 0 },
      ],
    ),
    "input-cap",
    0,
    0,
  );
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}

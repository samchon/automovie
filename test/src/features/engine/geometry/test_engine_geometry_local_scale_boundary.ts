import { AutoMovieEngineConstructionLocalScaleMinorant as Minorant } from "@automovie/engine";
import type { IAutoMovieConstructionLocalScaleMinorant } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

type ICap = IAutoMovieConstructionLocalScaleMinorant.ICap;
type Result = IAutoMovieConstructionLocalScaleMinorant.Result;

/** One call's result and its certificate calls `[index, factor, forward]`. */
interface IRun {
  result: Result;
  calls: [number, number, boolean][];
}

/**
 * `AutoMovieEngineConstructionLocalScaleMinorant.create` attenuates a positive scale
 * field by one factor alpha that every literal certificate admits, or refuses
 * at the stage that fails; it never tries a second candidate.
 *
 * Expectations are exact binary64 values: the predecessor of 1/2 is 1/2 -
 * 2^-54, and its products by 1/2 and 1/4 are exact dyadics; MIN_VALUE times a
 * factor below 2^-1022 rounds to zero.
 *
 * Scenarios:
 *
 * 1. A field already under its caps (caps listed out of field order) and a field
 *    exactly on its cap keep every value with alpha 1, no limiting column, and
 *    two certificate calls per cap.
 * 2. Field (1, 1/2, 1/4) with caps 1/2 at 0 and 1 at 1 takes alpha = 1/2 - 2^-54
 *    and limiting column 0; the four cap calls are forward and the fifth, the
 *    uncapped column 2, backward. A tie of two limiting columns lists both.
 * 3. A held certificate refusing the admitted factor stops at `held-certificate`
 *    after one call; a final certificate refusing the candidate stops at
 *    `candidate-certificate` after two, or at the backward column after three;
 *    a stricter log obstacle stops at `candidate-log`; each refusal keeps the
 *    certificate's own reason.
 * 4. A MIN_VALUE cap on 1 has a zero alpha (`alpha`); a positive alpha that takes
 *    MIN_VALUE to zero refuses at `candidate-field`; a MIN_VALUE field on a
 *    MIN_VALUE cap is admitted unchanged.
 * 5. Empty fields and caps, field values 0, -1 and 2, factors 0, -1 and 2, a
 *    positive logarithm, indices -1 and past the field and a duplicate index
 *    refuse at `input-field` or `input-cap` with no certificate call.
 * 6. No call changes its field or caps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the held versus candidate checks, exact attenuated factor, call order and field or underflow refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Submits explicit scale and cap arrays with counted certificates and checks accepted factors, limiting columns, returned failures and input preservation.
 * @evidence contracts/development/testing.md#independent-expectations The predecessor of one half is one half minus 2 to the power −54. Its dyadic products and the MIN_VALUE underflow independently fix the accepted and refused stages.
 */
export function test_engine_geometry_local_scale_boundary(): void {
  const run = (
    label: string,
    values: readonly number[],
    caps: readonly ICap[],
    certify: IAutoMovieConstructionLocalScaleMinorant.Certify = ():
      | string
      | null => null,
  ): IRun => {
    const before: string = JSON.stringify([values, caps]);
    const calls: [number, number, boolean][] = [];
    const result: Result = Minorant.create(
      values,
      caps,
      (index: number, factor: number, forward: boolean): string | null => {
        calls.push([index, factor, forward]);
        return certify(index, factor, forward);
      },
    );
    TestValidator.equals(
      `${label} inputs kept`,
      JSON.stringify([values, caps]),
      before,
    );
    return { result, calls };
  };
  const accepted = (
    label: string,
    actual: IRun,
    alpha: number,
    field: number[],
    limiting: number[],
    calls: number,
  ): void => {
    const read: Result =
      actual.result.kind === "accepted"
        ? {
            ...actual.result,
            limitingIndices: [...actual.result.limitingIndices].sort(
              (left: number, right: number): number => left - right,
            ),
          }
        : actual.result;
    const expected: Result = {
      kind: "accepted",
      field,
      alpha,
      limitingIndices: limiting,
    };
    TestValidator.equals(label, read, expected);
    TestValidator.equals(`${label} calls`, actual.calls.length, calls);
  };
  const refused = (
    label: string,
    actual: IRun,
    stage: Extract<Result, { kind: "refused" }>["stage"],
    index: number | null,
    calls: number,
    reason?: string,
  ): void => {
    const read: [string, number | null] =
      actual.result.kind === "refused"
        ? [actual.result.stage, actual.result.index]
        : [actual.result.kind, null];
    const expected: [string, number | null] = [stage, index];
    TestValidator.equals(label, read, expected);
    if (actual.result.kind === "refused")
      TestValidator.predicate(
        `${label} reason`,
        reason === undefined
          ? actual.result.reason.length !== 0
          : actual.result.reason === reason,
      );
    TestValidator.equals(`${label} calls`, actual.calls.length, calls);
  };
  const cap = (index: number, factor: number): ICap => ({
    index,
    factor,
    logarithm: Math.log(factor),
  });

  // 1.
  accepted(
    "under caps",
    run("under caps", [1 / 2, 1 / 4], [cap(1, 1 / 2), cap(0, 3 / 4)]),
    1,
    [1 / 2, 1 / 4],
    [],
    4,
  );
  accepted(
    "on cap",
    run("on cap", [1 / 2], [cap(0, 1 / 2)]),
    1,
    [1 / 2],
    [],
    2,
  );

  // 2.
  const alpha: number = 1 / 2 - 2 ** -54;
  const dyadic: IRun = run(
    "dyadic",
    [1, 1 / 2, 1 / 4],
    [cap(0, 1 / 2), cap(1, 1)],
  );
  accepted(
    "dyadic",
    dyadic,
    alpha,
    [alpha, 1 / 4 - 2 ** -55, 1 / 8 - 2 ** -56],
    [0],
    5,
  );
  TestValidator.equals(
    "dyadic directions",
    dyadic.calls.map(([index, , forward]): [number, boolean] => [
      index,
      forward,
    ]),
    [
      [dyadic.calls[0]![0], true],
      [dyadic.calls[1]![0], true],
      [dyadic.calls[2]![0], true],
      [dyadic.calls[3]![0], true],
      [2, false],
    ],
  );
  accepted(
    "tied",
    run("tied", [1, 1 / 2], [cap(0, 1 / 2), cap(1, 1 / 4)]),
    alpha,
    [alpha, 1 / 4 - 2 ** -55],
    [0, 1],
    4,
  );

  // 3.
  const held: string = "analytic certificate requires factor <= 1/4";
  refused(
    "held",
    run("held", [1 / 4], [cap(0, 1 / 2)], (_i: number, f: number) =>
      f <= 1 / 4 ? null : held,
    ),
    "held-certificate",
    0,
    1,
    held,
  );
  const final: string = "literal certificate requires factor >= 1/2";
  refused(
    "final",
    run("final", [1], [cap(0, 1 / 2)], (_i: number, f: number) =>
      f >= 1 / 2 ? null : final,
    ),
    "candidate-certificate",
    0,
    2,
    final,
  );
  const backward: string = "the supplied backward vector certificate refused";
  refused(
    "backward",
    run(
      "backward",
      [1, 1 / 2],
      [cap(0, 1 / 2)],
      (_i: number, _f: number, forward: boolean) => (forward ? null : backward),
    ),
    "candidate-certificate",
    1,
    3,
    backward,
  );
  refused(
    "log",
    run(
      "log",
      [1 / 2],
      [{ index: 0, factor: 1 / 2, logarithm: Math.log(1 / 4) }],
    ),
    "candidate-log",
    0,
    1,
  );

  // 4.
  refused(
    "zero alpha",
    run("zero alpha", [1], [cap(0, Number.MIN_VALUE)]),
    "alpha",
    null,
    1,
  );
  refused(
    "zero product",
    run("zero product", [1, Number.MIN_VALUE], [cap(0, 2 ** -1022)]),
    "candidate-field",
    1,
    1,
  );
  accepted(
    "subnormal",
    run("subnormal", [Number.MIN_VALUE], [cap(0, Number.MIN_VALUE)]),
    1,
    [Number.MIN_VALUE],
    [],
    2,
  );

  // 5.
  refused(
    "empty field",
    run("empty field", [], [cap(0, 1)]),
    "input-field",
    null,
    0,
  );
  refused("empty caps", run("empty caps", [1], []), "input-cap", null, 0);
  for (const value of [0, -1, 2])
    refused(
      `field ${value}`,
      run(`field ${value}`, [value], [cap(0, 1)]),
      "input-field",
      0,
      0,
    );
  for (const factor of [0, -1, 2])
    refused(
      `factor ${factor}`,
      run(`factor ${factor}`, [1], [{ index: 0, factor, logarithm: 0 }]),
      "input-cap",
      0,
      0,
    );
  refused(
    "positive log",
    run(
      "positive log",
      [1],
      [{ index: 0, factor: 1, logarithm: Number.MIN_VALUE }],
    ),
    "input-cap",
    0,
    0,
  );
  for (const index of [-1, 1])
    refused(
      `index ${index}`,
      run(`index ${index}`, [1], [cap(index, 1)]),
      "input-cap",
      null,
      0,
    );
  refused(
    "duplicate index",
    run("duplicate index", [1], [cap(0, 1), cap(0, 1)]),
    "input-cap",
    0,
    0,
  );
}

import type { IAutoMovieAffineBoxBound } from "@automovie/interface";
import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * Bound admitted affine rows and reject unrepresentable inputs and views.
 *
 * Scenarios:
 *
 * 1. Signed and canceled weights retain the exact inclusive tolerance result.
 * 2. Nonfinite or sparse tuples and invalid thresholds and budgets throw.
 * 3. Invalid control ordinals and nonfinite weights throw before conversion.
 * 4. Finite inputs whose numeric result is unrepresentable throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify signed rows, cancellation, dense coordinates, term admission and numeric result representability as independent decisions.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public Recovery operation on typed row records and observes the exact tolerance decision, finite views and owner messages for malformed records.
 * @evidence contracts/development/testing.md#independent-expectations The canceled ID contributes zero and the remaining coefficient of minus one maps [-1, 1] onto [-1, 1]. Targets at 2 and 2.5 have distances 1 and 1.5. Two maximum finite magnitudes overflow an absolute sum or Euclidean norm.
 */
export function test_recovery_observation_affine_box_bound(): void {
  const bound: IAutoMovieAffineBoxBound.Operation =
    AutoMovieRecoveryObservation.computeReachableChartBox;
  const base: IAutoMovieAffineBoxBound.IInput = {
    constantMm: [0, 0, 0],
    terms: [{ id: 0, weight: 1 }],
    lowerMm: [-1, -1, -1],
    upperMm: [1, 1, 1],
    targetMm: [0, 0, 0],
    toleranceMm: 1,
    maxTerms: 4,
  };
  const signed: IAutoMovieAffineBoxBound.IInput = {
    ...base,
    terms: [
      { id: 0, weight: 1 },
      { id: 0, weight: -1 },
      { id: 1, weight: -1 },
    ],
    targetMm: [2, 0, 0],
    maxTerms: 3,
  };
  const equal: IAutoMovieAffineBoxBound.IResult = bound(signed);
  const outside: IAutoMovieAffineBoxBound.IResult = bound({
    ...signed,
    targetMm: [2.5, 0, 0],
  });
  TestValidator.predicate(
    "a canceled control remains counted and equality passes",
    equal.terms === 2 &&
      nclose(equal.weightSum, -1, 0) &&
      nclose(equal.absoluteWeightSum, 1, 0) &&
      equal.lowerMm.every((value) => nclose(value, -1, 0)) &&
      equal.upperMm.every((value) => nclose(value, 1, 0)) &&
      nclose(equal.minimumDistanceMm, 1, 0) &&
      !equal.infeasibleAtTolerance &&
      nclose(outside.minimumDistanceMm, 1.5, 0) &&
      outside.infeasibleAtTolerance,
  );

  const sparse: [number, number, number] = [0, 0, 0];
  Reflect.deleteProperty(sparse, 1);
  const cases: readonly [
    string,
    Partial<IAutoMovieAffineBoxBound.IInput>,
    string,
  ][] = [
    ["constant", { constantMm: [Infinity, 0, 0] }, "Finite affine row"],
    ["lower", { lowerMm: [NaN, -1, -1] }, "Finite affine row"],
    ["upper", { upperMm: [1, Infinity, 1] }, "Finite affine row"],
    ["target", { targetMm: [0, NaN, 0] }, "Finite affine row"],
    ["sparse", { constantMm: sparse }, "Finite affine row"],
    ["tolerance", { toleranceMm: Infinity }, "Finite affine row"],
    ["cap NaN", { maxTerms: NaN }, "Finite affine row"],
    ["cap fractional", { maxTerms: 2.5 }, "Finite affine row"],
    ["cap Infinity", { maxTerms: Infinity }, "Finite affine row"],
    [
      "cap unsafe",
      { maxTerms: Number.MAX_SAFE_INTEGER + 1 },
      "Finite affine row",
    ],
    ["reversed interval", { lowerMm: [2, -1, -1] }, "Finite affine row"],
    [
      "raw term count",
      { terms: signed.terms, maxTerms: 2 },
      "Finite affine row",
    ],
    ["fractional id", { terms: [{ id: 0.5, weight: 1 }] }, "Finite weights"],
    ["NaN id", { terms: [{ id: NaN, weight: 1 }] }, "Finite weights"],
    ["infinite id", { terms: [{ id: Infinity, weight: 1 }] }, "Finite weights"],
    [
      "unsafe id",
      { terms: [{ id: Number.MAX_SAFE_INTEGER + 1, weight: 1 }] },
      "Finite weights",
    ],
    ["NaN weight", { terms: [{ id: 0, weight: NaN }] }, "Finite weights"],
    [
      "infinite weight",
      { terms: [{ id: 0, weight: Infinity }] },
      "Finite weights",
    ],
    [
      "duplicate weight overflow",
      {
        terms: [
          { id: 0, weight: Number.MAX_VALUE },
          { id: 0, weight: Number.MAX_VALUE },
        ],
      },
      "combined binary64",
    ],
    [
      "distance overflow",
      {
        terms: [],
        lowerMm: [0, 0, 0],
        upperMm: [0, 0, 0],
        targetMm: [Number.MAX_VALUE, Number.MAX_VALUE, 0],
      },
      "numeric summary",
    ],
    [
      "absolute weight overflow",
      {
        lowerMm: [0, 0, 0],
        upperMm: [0, 0, 0],
        terms: [
          { id: 0, weight: Number.MAX_VALUE },
          { id: 1, weight: -Number.MAX_VALUE },
        ],
      },
      "numeric summary",
    ],
  ];
  const missed = cases.flatMap(([label, input, message]) => {
    try {
      const result: IAutoMovieAffineBoxBound.IResult = bound({
        ...base,
        ...input,
      });
      return [
        `${label}: accepted ${result.minimumDistanceMm}/${result.absoluteWeightSum}`,
      ];
    } catch (cause) {
      return cause instanceof Error && cause.message.includes(message)
        ? []
        : [`${label}: ${String(cause)}`];
    }
  });
  TestValidator.equals(
    "refuse invalid affine rows from the owning check",
    missed,
    [],
  );
}

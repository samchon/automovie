import { TestValidator } from "@nestia/e2e";

import { createRecoveryFeasibleDiagnostics } from "../../../../packages/recovery/src/internal/createRecoveryFeasibleDiagnostics";
import { encodeRecoveryDiagnosticNumber } from "../../../../packages/recovery/src/internal/encodeRecoveryDiagnosticNumber";
import type { IAutoMovieRecoveryFeasibleDiagnostics } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryFeasibleDiagnostics";
import type { IAutoMovieRecoveryFeasibleFit } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleFit";

/**
 * Fixed feasible diagnostics preserve every scalar's resident and JSON meaning.
 *
 * Scenarios:
 * 1. An authored complete raw record projects all67 fields, distinguishing finite values, three nonfinite categories and unavailable null.
 * 2. Fixed nested records are independent copies and frozen raw records/state remain unchanged; no state, array or invented age crosses the projection.
 * 3. Null baseline/auxiliary reports stay null, while an older auxiliary reason and trial failure remain unchanged beside a terminal baseline.
 * 4. Finite extrema and signed zero preserve resident number semantics; JSON preserves categories without promising signed-zero bits.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual fixed projection/encoder and serializes its result; missing fields, implicit nonfinite null conversion, aliasing and state leakage change the independently prescribed JSON object.
 * @evidence contracts/testing.md#independent-expectations Authored integers and exactly representable tolerance0.25 label each field independently; the explicit expected object follows the public scalar representation rather than a captured solver output. This tests representation, not numerical convergence or certificate truth.
 * @evidence contracts/testing.md#distinguishing-cases Covers complete/null optional records, nullable scalars, mixed booleans, all three nonfinite sentinels, stale reasons, finite extrema, signed zero, JSON roundtrip, nested identity and frozen borrowed input.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_diagnostics entry uses authored plain records and JSON only; no fit, foreign override, host, process, compiler, filesystem, GPU or photograph starts.
 */
export function test_recovery_feasible_diagnostics(): void {
  const fit: IAutoMovieRecoveryFeasibleFit<readonly number[]> = {
    state: Object.freeze([137]),
    converged: false,
    termination: "iteration-budget",
    iterations: 100,
    acceptedSteps: 25,
    initialCost: 20,
    finalCost: 19,
    tolerance: 0.25,
    objectiveMultiplier: Infinity,
    stationarity: NaN,
    stationarityScale: -Infinity,
    complementarity: null,
    normalKktQualified: false,
    directionWork: Infinity,
    lastDirection: {
      termination: "iteration-budget",
      gamma: 1,
      objective: 2,
      gap: 3,
      maximumViolation: Infinity,
      complementarity: -Infinity,
      arithmeticAllowance: NaN,
      simplexResidual: 7,
      stationarityResidual: 8,
      stationarityAllowance: 9,
      returnedRowsQualified: true,
      reconstructionRowsQualified: false,
      aggregateAllowance: 12,
      minimumPriceAllowance: 13,
      gapAllowance: 14,
      gapUpperBound: 15,
      exactGapTargetMet: false,
      roundoffLimited: true,
      certified: false,
      iterations: 19,
      work: 20,
    },
    lastSqp: {
      qualified: false,
      reason: "working-rank-unresolved",
      selectedRows: 3,
      coordinates: 4,
      designRatio: Infinity,
      maximumViolation: NaN,
      equalityResidual: -Infinity,
      stationarityResidual: 8,
      stationarityScale: 9,
      equalityBeforeRefinement: 10,
      refinementAttempted: true,
      nominalMixWeight: 12,
      numericalMixAttempted: true,
      numericalMixSupported: false,
      mixWeight: 15,
      correctionAttempted: true,
      correctionSupported: false,
      correctionTightening: {
        ceiling: 1,
        value: Infinity,
        descent: NaN,
        multiplierPrice: null,
        reason: "objective-cap",
      },
      correctionFailure: "target-unresolved",
      work: 20,
    },
    trials: {
      baseline: 1,
      nominal: 2,
      numerical: 3,
      corrected: 4,
      half: 5,
      qualifiedUnselected: 6,
      infeasible: 7,
      nondecreasing: 8,
      armijo: 9,
      lastFailure: "armijo",
      work: 10,
    },
  };
  Object.freeze(fit.lastDirection);
  Object.freeze(fit.lastSqp!.correctionTightening);
  Object.freeze(fit.lastSqp);
  Object.freeze(fit.trials);
  Object.freeze(fit);
  const expected: IAutoMovieRecoveryFeasibleDiagnostics = {
    tolerance: 0.25,
    objectiveMultiplier: "+Infinity",
    stationarity: "NaN",
    stationarityScale: "-Infinity",
    complementarity: null,
    normalKktQualified: false,
    directionWork: "+Infinity",
    lastDirection: {
      termination: "iteration-budget",
      gamma: 1,
      objective: 2,
      gap: 3,
      maximumViolation: "+Infinity",
      complementarity: "-Infinity",
      arithmeticAllowance: "NaN",
      simplexResidual: 7,
      stationarityResidual: 8,
      stationarityAllowance: 9,
      returnedRowsQualified: true,
      reconstructionRowsQualified: false,
      aggregateAllowance: 12,
      minimumPriceAllowance: 13,
      gapAllowance: 14,
      gapUpperBound: 15,
      exactGapTargetMet: false,
      roundoffLimited: true,
      certified: false,
      iterations: 19,
      work: 20,
    },
    lastSqp: {
      qualified: false,
      reason: "working-rank-unresolved",
      selectedRows: 3,
      coordinates: 4,
      designRatio: "+Infinity",
      maximumViolation: "NaN",
      equalityResidual: "-Infinity",
      stationarityResidual: 8,
      stationarityScale: 9,
      equalityBeforeRefinement: 10,
      refinementAttempted: true,
      nominalMixWeight: 12,
      numericalMixAttempted: true,
      numericalMixSupported: false,
      mixWeight: 15,
      correctionAttempted: true,
      correctionSupported: false,
      correctionTightening: {
        ceiling: 1,
        value: "+Infinity",
        descent: "NaN",
        multiplierPrice: null,
        reason: "objective-cap",
      },
      correctionFailure: "target-unresolved",
      work: 20,
    },
    trials: {
      baseline: 1,
      nominal: 2,
      numerical: 3,
      corrected: 4,
      half: 5,
      qualifiedUnselected: 6,
      infeasible: 7,
      nondecreasing: 8,
      armijo: 9,
      lastFailure: "armijo",
      work: 10,
    },
  };
  const actual: IAutoMovieRecoveryFeasibleDiagnostics =
    createRecoveryFeasibleDiagnostics(fit);
  const serialized: string = JSON.stringify(actual);
  TestValidator.predicate(
    "all fixed values and JSON categories match the authored contract",
    serialized === JSON.stringify(expected) &&
      JSON.stringify(JSON.parse(serialized)) === JSON.stringify(expected),
  );
  TestValidator.predicate(
    "encoded records own their fields without state or raw aliases",
    actual !== (fit as unknown) &&
      actual.lastDirection !== (fit.lastDirection as unknown) &&
      actual.lastSqp !== (fit.lastSqp as unknown) &&
      actual.lastSqp!.correctionTightening !==
        (fit.lastSqp!.correctionTightening as unknown) &&
      actual.trials !== (fit.trials as unknown) &&
      !Object.hasOwn(actual, "state") &&
      !serialized.includes("137") &&
      fit.objectiveMultiplier === Infinity &&
      Number.isNaN(fit.stationarity) &&
      fit.stationarityScale === -Infinity &&
      fit.state[0] === 137,
  );
  const unavailable: IAutoMovieRecoveryFeasibleDiagnostics =
    createRecoveryFeasibleDiagnostics({
      ...fit,
      objectiveMultiplier: null,
      stationarity: null,
      stationarityScale: null,
      complementarity: null,
      lastDirection: null,
      lastSqp: null,
    });
  TestValidator.predicate(
    "unavailable values remain distinct from computed nonfinite values",
    unavailable.objectiveMultiplier === null &&
      unavailable.stationarity === null &&
      unavailable.stationarityScale === null &&
      unavailable.complementarity === null &&
      unavailable.lastDirection === null &&
      unavailable.lastSqp === null &&
      unavailable.trials.lastFailure === "armijo",
  );
  TestValidator.predicate(
    "finite endpoints and resident signed zero are not replaced",
    encodeRecoveryDiagnosticNumber(Number.MAX_VALUE) === Number.MAX_VALUE &&
      encodeRecoveryDiagnosticNumber(-Number.MAX_VALUE) === -Number.MAX_VALUE &&
      Object.is(encodeRecoveryDiagnosticNumber(-0), -0) &&
      JSON.stringify(encodeRecoveryDiagnosticNumber(-0)) === "0" &&
      encodeRecoveryDiagnosticNumber(NaN) === "NaN" &&
      encodeRecoveryDiagnosticNumber(Infinity) === "+Infinity" &&
      encodeRecoveryDiagnosticNumber(-Infinity) === "-Infinity",
  );
}

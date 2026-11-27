import type {
  IAutoMovieRecoveryFeasibleDiagnostics,
  IAutoMovieRecoveryFeasibleFit,
} from "@automovie/interface";
import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * Fixed feasible diagnostics preserve every scalar's resident and JSON meaning.
 *
 * Scenarios:
 *
 * 1. An authored complete raw record projects all67 fields, distinguishing finite
 *    values, three nonfinite categories and unavailable null.
 * 2. Fixed nested records are independent copies and frozen raw records/state
 *    remain unchanged; no state, array or invented age crosses the projection.
 * 3. Null baseline/auxiliary reports stay null, while an older auxiliary reason
 *    and trial failure remain unchanged beside a terminal baseline.
 */
export function test_recovery_internal_create_feasible_diagnostics(): void {
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
    stationarity: 4,
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
      arithmeticAllowance: 6,
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
      maximumViolation: 7,
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
        descent: 2,
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
    stationarity: 4,
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
      arithmeticAllowance: 6,
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
      maximumViolation: 7,
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
        descent: 2,
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
    AutoMovieRecoveryCameraMap.createFeasibleDiagnostics(fit);
  const serialized: string = JSON.stringify(actual);
  TestValidator.predicate(
    "all fixed values and JSON categories match the authored contract",
    serialized === JSON.stringify(expected) &&
      JSON.stringify(JSON.parse(serialized)) === JSON.stringify(expected),
  );
  const distinct: (a: object | null, b: object | null) => boolean = (
    a: object | null,
    b: object | null,
  ): boolean => a !== b;
  TestValidator.predicate(
    "encoded records own their fields without state or raw aliases",
    distinct(actual, fit) &&
      distinct(actual.lastDirection, fit.lastDirection) &&
      distinct(actual.lastSqp, fit.lastSqp) &&
      distinct(
        actual.lastSqp!.correctionTightening,
        fit.lastSqp!.correctionTightening,
      ) &&
      distinct(actual.trials, fit.trials) &&
      !serialized.includes("137") &&
      fit.objectiveMultiplier === Infinity &&
      fit.stationarityScale === -Infinity &&
      fit.state[0] === 137,
  );
  const unavailable: IAutoMovieRecoveryFeasibleDiagnostics =
    AutoMovieRecoveryCameraMap.createFeasibleDiagnostics({
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
}

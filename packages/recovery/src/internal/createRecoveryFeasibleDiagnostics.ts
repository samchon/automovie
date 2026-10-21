import type { IAutoMovieRecoveryFeasibleDiagnostics } from "../structures/image/IAutoMovieRecoveryFeasibleDiagnostics";
import type { IAutoMovieRecoveryFeasibleFit } from "../structures/internal/IAutoMovieRecoveryFeasibleFit";
import { encodeRecoveryDiagnosticNumber } from "./encodeRecoveryDiagnosticNumber";

/**
 * Project the completed generic fit's fixed diagnostics into JSON-safe values.
 * Shared camera counts/costs and existing adaptive/curvature reports stay with
 * their original owner. No geometry or raw numeric input is mutated.
 *
 * @evidence contracts/common.md#principled-implementation Explicit fields preserve normal inputs, baseline QP/certificate, optional SQP/tightening and whole-fit path/outcome marginals without reconstructing a hidden process or changing numerical predicates.
 * @evidence contracts/common.md#clear-and-simple-design A fixed projection and scalar encoder own representation; generic fitting owns raw values, and the camera/scene retain the resulting report under their admitted fixed reservation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No object walker, state/array/factor access, synthetic age, zero fallback, report mutation or post-fit numerical exception supplies diagnostics.
 * @evidence contracts/common.md#meaningful-documentation LastDirection/normal are terminal checks; lastSqp and lastFailure can be older. Existing null is unavailable while fixed sentinels preserve computed nonfinite values. Runtime and JSON share those categories.
 * @evidence contracts/performance.md#efficient-algorithms A fixed typed member inventory drives constant field visits and allocations, independent of camera/point/row width. The camera owner must prepay the audited projection/publication bound before fitting.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads only already produced scalars and fixed records; no projection, residual, model, solve, actual trial or physical certificate is reevaluated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One bounded independent encoded block transfers. It contains no source object, array, state, callback or handle. Raw/encoded overlap, accumulated attempt reports and trace copies belong to the scene/fit reservation audit, not a free-alias claim.
 */
export function createRecoveryFeasibleDiagnostics(
  fit: IAutoMovieRecoveryFeasibleFit<unknown>,
): IAutoMovieRecoveryFeasibleDiagnostics {
  const direction: typeof fit.lastDirection = fit.lastDirection;
  const sqp: typeof fit.lastSqp = fit.lastSqp;
  const tightening: NonNullable<typeof fit.lastSqp>["correctionTightening"] =
    sqp?.correctionTightening ?? null;
  const trials: typeof fit.trials = fit.trials;
  return {
    tolerance: fit.tolerance,
    objectiveMultiplier:
      fit.objectiveMultiplier === null
        ? null
        : encodeRecoveryDiagnosticNumber(fit.objectiveMultiplier),
    stationarity:
      fit.stationarity === null
        ? null
        : encodeRecoveryDiagnosticNumber(fit.stationarity),
    stationarityScale:
      fit.stationarityScale === null
        ? null
        : encodeRecoveryDiagnosticNumber(fit.stationarityScale),
    complementarity:
      fit.complementarity === null
        ? null
        : encodeRecoveryDiagnosticNumber(fit.complementarity),
    normalKktQualified: fit.normalKktQualified,
    directionWork: encodeRecoveryDiagnosticNumber(fit.directionWork),
    lastDirection:
      direction === null
        ? null
        : {
            termination: direction.termination,
            gamma: encodeRecoveryDiagnosticNumber(direction.gamma),
            objective: encodeRecoveryDiagnosticNumber(direction.objective),
            gap: encodeRecoveryDiagnosticNumber(direction.gap),
            maximumViolation: encodeRecoveryDiagnosticNumber(
              direction.maximumViolation,
            ),
            complementarity: encodeRecoveryDiagnosticNumber(
              direction.complementarity,
            ),
            arithmeticAllowance: encodeRecoveryDiagnosticNumber(
              direction.arithmeticAllowance,
            ),
            simplexResidual: encodeRecoveryDiagnosticNumber(
              direction.simplexResidual,
            ),
            stationarityResidual: encodeRecoveryDiagnosticNumber(
              direction.stationarityResidual,
            ),
            stationarityAllowance: encodeRecoveryDiagnosticNumber(
              direction.stationarityAllowance,
            ),
            returnedRowsQualified: direction.returnedRowsQualified,
            reconstructionRowsQualified: direction.reconstructionRowsQualified,
            aggregateAllowance: encodeRecoveryDiagnosticNumber(
              direction.aggregateAllowance,
            ),
            minimumPriceAllowance: encodeRecoveryDiagnosticNumber(
              direction.minimumPriceAllowance,
            ),
            gapAllowance: encodeRecoveryDiagnosticNumber(
              direction.gapAllowance,
            ),
            gapUpperBound: encodeRecoveryDiagnosticNumber(
              direction.gapUpperBound,
            ),
            exactGapTargetMet: direction.exactGapTargetMet,
            roundoffLimited: direction.roundoffLimited,
            certified: direction.certified,
            iterations: encodeRecoveryDiagnosticNumber(direction.iterations),
            work: encodeRecoveryDiagnosticNumber(direction.work),
          },
    lastSqp:
      sqp === null
        ? null
        : {
            qualified: sqp.qualified,
            reason: sqp.reason,
            selectedRows: encodeRecoveryDiagnosticNumber(sqp.selectedRows),
            coordinates: encodeRecoveryDiagnosticNumber(sqp.coordinates),
            designRatio:
              sqp.designRatio === null
                ? null
                : encodeRecoveryDiagnosticNumber(sqp.designRatio),
            maximumViolation:
              sqp.maximumViolation === null
                ? null
                : encodeRecoveryDiagnosticNumber(sqp.maximumViolation),
            equalityResidual:
              sqp.equalityResidual === null
                ? null
                : encodeRecoveryDiagnosticNumber(sqp.equalityResidual),
            stationarityResidual:
              sqp.stationarityResidual === null
                ? null
                : encodeRecoveryDiagnosticNumber(sqp.stationarityResidual),
            stationarityScale:
              sqp.stationarityScale === null
                ? null
                : encodeRecoveryDiagnosticNumber(sqp.stationarityScale),
            equalityBeforeRefinement:
              sqp.equalityBeforeRefinement === null
                ? null
                : encodeRecoveryDiagnosticNumber(sqp.equalityBeforeRefinement),
            refinementAttempted: sqp.refinementAttempted,
            nominalMixWeight:
              sqp.nominalMixWeight === null
                ? null
                : encodeRecoveryDiagnosticNumber(sqp.nominalMixWeight),
            numericalMixAttempted: sqp.numericalMixAttempted,
            numericalMixSupported: sqp.numericalMixSupported,
            mixWeight:
              sqp.mixWeight === null
                ? null
                : encodeRecoveryDiagnosticNumber(sqp.mixWeight),
            correctionAttempted: sqp.correctionAttempted,
            correctionSupported: sqp.correctionSupported,
            correctionTightening:
              tightening === null
                ? null
                : {
                    ceiling:
                      tightening.ceiling === null
                        ? null
                        : encodeRecoveryDiagnosticNumber(tightening.ceiling),
                    value:
                      tightening.value === null
                        ? null
                        : encodeRecoveryDiagnosticNumber(tightening.value),
                    descent:
                      tightening.descent === null
                        ? null
                        : encodeRecoveryDiagnosticNumber(tightening.descent),
                    multiplierPrice:
                      tightening.multiplierPrice === null
                        ? null
                        : encodeRecoveryDiagnosticNumber(
                            tightening.multiplierPrice,
                          ),
                    reason: tightening.reason,
                  },
            correctionFailure: sqp.correctionFailure,
            work: encodeRecoveryDiagnosticNumber(sqp.work),
          },
    trials: {
      baseline: encodeRecoveryDiagnosticNumber(trials.baseline),
      nominal: encodeRecoveryDiagnosticNumber(trials.nominal),
      numerical: encodeRecoveryDiagnosticNumber(trials.numerical),
      corrected: encodeRecoveryDiagnosticNumber(trials.corrected),
      half: encodeRecoveryDiagnosticNumber(trials.half),
      qualifiedUnselected: encodeRecoveryDiagnosticNumber(
        trials.qualifiedUnselected,
      ),
      infeasible: encodeRecoveryDiagnosticNumber(trials.infeasible),
      nondecreasing: encodeRecoveryDiagnosticNumber(trials.nondecreasing),
      armijo: encodeRecoveryDiagnosticNumber(trials.armijo),
      lastFailure: trials.lastFailure,
      work: encodeRecoveryDiagnosticNumber(trials.work),
    },
  };
}

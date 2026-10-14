import type {
  IAutoMovieAcceptanceScenario,
  IAutoMovieCompiledContractRealization,
  IAutoMovieDiagnostic,
  IAutoMovieShotContract,
  IAutoMovieStorySyncOutcome,
} from "@automovie/interface";

import { autoMovieStorySyncOutcome } from "./autoMovieStorySyncOutcome";
import { storySyncCriterionOf } from "./storySyncCriterionOf";

/**
 * Report failed simultaneity claims after the attempt's shots are realized.
 *
 * compileAutoMovieProductionShots calls this before film assembly. Required
 * failures are errors and optional failures are warnings; edit order does not
 * alter the claimed story moment. Design-window feasibility is a separate gate.
 *
 * @evidence contracts/common.md#principled-implementation Measures every story-sync acceptance criterion against the compiled attempt and reports failed or unresolved outcomes; required scenarios block the build while optional ones remain visible warnings.
 * @evidence contracts/common.md#clear-and-simple-design Owns acceptance-to-diagnostic policy, delegating family selection and engine measurement through their adapters. Other acceptance kinds are not measured here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses authored requirement flags, event addresses and tolerances without special scenario IDs; unresolved measurements remain failures rather than disappearing.
 * @evidence contracts/common.md#meaningful-documentation Names the compile caller, error/warning policy and distinction between feasible design windows and actual realized times. Input iteration order determines diagnostic order; this function does not sort.
 * @evidence contracts/performance.md#efficient-algorithms Visits A scenarios once, with each story-sync criterion's engine and event-search costs delegated to autoMovieStorySyncOutcome. Diagnostics occupy O(F) space for F failures, with only the current outcome's points temporary.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the attempt's existing contract and realization maps across criteria. No outcome cache assumes distinct criteria or later attempts address equivalent observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no handle or task; outcomes become unreachable after their summaries are copied, and the caller owns the returned diagnostic array.
 */
export function storySyncDiagnostics(props: {
  acceptance: ReadonlyMap<string, IAutoMovieAcceptanceScenario>;
  contracts: ReadonlyMap<string, IAutoMovieShotContract>;
  realizations: ReadonlyMap<string, IAutoMovieCompiledContractRealization>;
}): IAutoMovieDiagnostic[] {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  for (const [id, scenario] of props.acceptance) {
    const criterion: Extract<IAutoMovieAcceptanceScenario["criterion"], { kind: "story-sync" }> | null =
      storySyncCriterionOf(scenario);
    if (criterion === null) continue;
    const outcome: IAutoMovieStorySyncOutcome = autoMovieStorySyncOutcome({
      criterion,
      contracts: props.contracts,
      realization: (shot: string): IAutoMovieCompiledContractRealization | null =>
        props.realizations.get(shot) ?? null,
    });
    if (outcome.passed) continue;
    diagnostics.push({
      code: "acceptance-story-sync-failed",
      category: scenario.required ? "error" : "warning",
      phase: "compile",
      target: `acceptance:${id}`,
      path: null,
      message: `Acceptance "${id}" claims these events share one story moment, and the compiled realizations say otherwise: ${outcome.summary} Move the realized event times in the owning shot sources, repin a shot's storyTime, or state the tolerance the film actually keeps.`,
    });
  }
  return diagnostics;
}

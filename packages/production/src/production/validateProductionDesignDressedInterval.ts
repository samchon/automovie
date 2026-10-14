import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Append the original refusal when twice a metre tolerance reaches its declared spacing.
 *
 * @evidence contracts/common.md#principled-implementation Invalid range values retain the caller's independent range diagnostics; this comparison changes neither tolerance nor spacing.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignDressedInterval owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms One scalar comparison and optional diagnostic construction take constant work plus message length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignDressedInterval: (diagnostics: IAutoMovieDiagnostic[], tolerance: number, spacing: number, axis: string, target: string, file: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  tolerance: number,
  spacing: number,
  axis: string,
  target: string,
  file: string,
): void => {
  if (2 * tolerance >= spacing)
    validateProductionDesignInvalid(
      diagnostics,
      "design-range-invalid",
      target,
      file,
      `Dressing tolerance ${tolerance} m reaches half the ${spacing} m ${axis} interval it perturbs, so two neighbouring members can stand in one place. Keep twice layout.dressing.${axis} below layout.spacing.${axis} in the tracked formation design record.`,
    );
};

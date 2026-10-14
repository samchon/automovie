import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Scan all supplied text values, reporting blank and repeated entries in original order.
 *
 * @evidence contracts/common.md#principled-implementation A call-local set distinguishes exact strings without case folding or input mutation.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignUniqueTextValues owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms For N values, total string scanning and expected set work are linear; O(N) distinct keys are transient.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignUniqueTextValues: (diagnostics: IAutoMovieDiagnostic[], values: readonly string[], target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  values: readonly string[],
  target: string,
  file: string,
  field: string,
): void => {
  const seen: Set<string> = new Set<string>();
  for (const value of values) {
    validateProductionDesignText(diagnostics, value, target, file, field);
    if (seen.has(value))
      validateProductionDesignInvalid(
        diagnostics,
        "design-duplicate-id",
        target,
        file,
        `Duplicate value "${value}" appears in ${field}. Keep each value once in its design setter.`,
      );
    seen.add(value);
  }
};

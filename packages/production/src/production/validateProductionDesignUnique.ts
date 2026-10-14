import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check nonblank identity before duplicate membership, then insert the identity even when it was invalid.
 *
 * @evidence contracts/common.md#principled-implementation The caller owns the seen set and diagnostic array, preserving later duplicate detection and refusal order.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignUnique owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms One text scan and expected constant set lookup/insertion per identity, with one retained key per distinct value.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignUnique: (diagnostics: IAutoMovieDiagnostic[], seen: Set<string>, id: string, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  seen: Set<string>,
  id: string,
  target: string,
  file: string,
  field: string,
): void => {
  validateProductionDesignText(diagnostics, id, target, file, `${field}.id`);
  if (seen.has(id))
    validateProductionDesignInvalid(
      diagnostics,
      "design-duplicate-id",
      target,
      file,
      `Duplicate id "${id}" appears in ${field}. Keep each id once in its design setter.`,
    );
  seen.add(id);
};

import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Scan all supplied text values, reporting blank and repeated entries in original order.
 *
 * @evidence contracts/common.md#principled-implementation A call-local set distinguishes exact strings without case folding or input mutation.
 * @evidence contracts/common.md#clear-and-simple-design One list pass serves capabilities, palette entries and subject labels; the text owner checks nonblank content and this helper owns a fresh exact-identity population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States blank-before-duplicate order, exact string comparison and local Set scope; findings append to the borrowed array while input order and spelling remain unchanged, including invalid values used for later duplicate detection.
 * @evidence contracts/performance.md#efficient-algorithms For N values, total string scanning and expected set work are linear; O(N) distinct keys are transient.
 * @evidence contracts/performance.md#reuse-equivalent-work One fresh Set shares exact membership across the current list, including invalid strings; no earlier list verdict or trim result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local Set borrows one key per distinct supplied string until return; blank/duplicate findings and correction text remain in the caller's array without a local quota, handle or task.
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

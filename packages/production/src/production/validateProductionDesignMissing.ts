import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Append one design-reference-missing diagnostic using the original dependency and correction text.
 *
 * @evidence contracts/common.md#principled-implementation Existence decisions remain caller-owned; no missing record is created or substituted.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignMissing owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Fixed interpolation and diagnostic append scale only with message text.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignMissing: (diagnostics: IAutoMovieDiagnostic[], target: string, file: string, dependency: string, correction: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  target: string,
  file: string,
  dependency: string,
  correction: string,
): void =>
  validateProductionDesignInvalid(
    diagnostics,
    "design-reference-missing",
    target,
    file,
    `Referenced ${dependency} does not exist. ${correction}.`,
  );

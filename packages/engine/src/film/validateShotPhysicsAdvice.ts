import type {
  IAutoMovieAuthoringDiagnostic,
  IAutoMovieShotPhysicsAdvice,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";

/**
 * Check a shot runtime's D010 physics advice before `compileDefinedShot` stages
 * anything, returning every `contract-mismatch` diagnostic at once.
 *
 * Each id must be unique, and each decision must match its
 * payload: pending keeps `selected` and `rationale` null, `accepted` selects a
 * response equal to the proposal, `modified` selects a different one,
 * `rejected` selects none, and every decided item states a non-blank rationale.
 * Responses are compared by value with object keys sorted, so key insertion
 * order never decides between `accepted` and `modified`. An empty list means
 * the advice is valid; the advice itself is never applied here.
 */
export function validateShotPhysicsAdvice(
  advice: readonly IAutoMovieShotPhysicsAdvice[],
): IAutoMovieAuthoringDiagnostic[] {
  const diagnostics: IAutoMovieAuthoringDiagnostic[] = [];
  const ids: Map<string, number> = new Map();
  advice.forEach((item: IAutoMovieShotPhysicsAdvice, index: number): void => {
    const path: string = `$runtime.advice[${index}]`;
    const first: number | undefined = ids.get(item.id);
    if (first !== undefined)
      diagnostics.push({
        code: "contract-mismatch",
        phase: "performance",
        path: `${path}.id`,
        fact: `Physics-advice id "${item.id}" duplicates $runtime.advice[${first}].id.`,
        impact:
          "The selected D010 decision cannot be audited against one stable proposal.",
        recovery:
          "Give every advice item one id that is unique in this shot.",
      });
    else ids.set(item.id, index);

    const rationaleValid: boolean =
      item.rationale !== null && item.rationale.trim().length !== 0;
    const proposalEqualsSelected: boolean =
      item.selected !== null &&
      JSON.stringify(canonicalAdviceValue(item.proposal)) ===
        JSON.stringify(canonicalAdviceValue(item.selected));
    const valid: boolean =
      item.decision === null
        ? item.selected === null && item.rationale === null
        : item.decision === "accepted"
          ? item.selected !== null && proposalEqualsSelected && rationaleValid
          : item.decision === "modified"
            ? item.selected !== null &&
              proposalEqualsSelected === false &&
              rationaleValid
            : item.selected === null && rationaleValid;
    if (valid === false)
      diagnostics.push({
        code: "contract-mismatch",
        phase: "performance",
        path,
        fact: `D010 advice "${item.id}" has decision ${JSON.stringify(item.decision)}, selected ${item.selected === null ? "null" : "response data"}, and rationale ${JSON.stringify(item.rationale)}.`,
        impact:
          "The artifact cannot distinguish an unchanged proposal, an authored replacement, and a rejected physical suggestion.",
        recovery:
          "Keep pending selected/rationale null; copy proposal into selected for accepted; provide a different selected response for modified; or keep selected null for rejected. Every decided item needs a non-blank rationale.",
      });
  });
  return diagnostics;
}

/** Deep-copy response data with object keys in code-unit order. */
function canonicalAdviceValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalAdviceValue);
  if (typeof value !== "object" || value === null) return value;
  const record: Record<string, unknown> = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort(compareCodeUnits)
      .map((key: string): [string, unknown] => [
        key,
        canonicalAdviceValue(record[key]),
      ]),
  );
}

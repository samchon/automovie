import { compareCodeUnits } from "../text/compareCodeUnits";
import { IAutoMovieAuthoringDiagnostic } from "./IAutoMovieAuthoringDiagnostic";
import { IAutoMovieShotPhysicsAdvice } from "./IAutoMovieShotPhysicsAdvice";

/**
 * Check a shot runtime's D010 physics advice before `compileDefinedShot` stages
 * anything, returning every `contract-mismatch` diagnostic at once.
 *
 * Each id must be non-blank and unique, and each decision must match its
 * payload: pending keeps `selected` and `rationale` null, `accepted` selects a
 * response equal to the proposal, `modified` selects a different one,
 * `rejected` selects none, and every decided item states a non-blank
 * rationale. Responses are compared by value with object keys sorted, so key
 * insertion order never decides between `accepted` and `modified`. An empty
 * list means the advice is valid; the advice itself is never applied here.
 *
 * @evidence contracts/common.md#principled-implementation One pass with a first-index map for ids, and each decision checked as a predicate over the advice union's documented branches; response equality is `JSON.stringify` of a key-sorted deep copy, which holds for the plain finite-number records `suggestCollisionResponse` produces but would equate a non-finite number with `null` and `-0` with `0`.
 * @evidence contracts/common.md#clear-and-simple-design Split from `compileDefinedShot` as the one owner of the advice rules, so the compiler only sequences phases; the key-sorting helper stays private because no other rule compares advice responses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no advice id, fixture or collision shape; a decision that disagrees with its payload is reported rather than coerced into the nearest valid branch.
 * @evidence contracts/common.md#meaningful-documentation States every id and decision rule, how responses are compared, that an empty result means valid, and that the advice is checked but never applied.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the advice count plus the size of each compared response, which is sorted per object level and serialized once per side; a shot carries a handful of advice items.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure check over one runtime's advice list that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains only the id map and diagnostics during the call; the caller owns the returned diagnostics, at most two per advice item.
 */
export function validateShotPhysicsAdvice (
  advice: readonly IAutoMovieShotPhysicsAdvice[],
): IAutoMovieAuthoringDiagnostic[] {
  const diagnostics: IAutoMovieAuthoringDiagnostic[] = [];
  const ids: Map<string, number> = new Map();
  advice.forEach((item: IAutoMovieShotPhysicsAdvice, index: number): void => {
    const path: string = `$runtime.advice[${index}]`;
    const first: number | undefined = ids.get(item.id);
    if (item.id.trim().length === 0 || first !== undefined)
      diagnostics.push({
        code: "contract-mismatch",
        phase: "performance",
        path: `${path}.id`,
        fact:
          first === undefined
            ? "The physics-advice id is blank."
            : `Physics-advice id "${item.id}" duplicates $runtime.advice[${first}].id.`,
        impact:
          "The selected D010 decision cannot be audited against one stable proposal.",
        recovery:
          "Give every advice item one non-blank id that is unique in this shot.",
      });
    else ids.set(item.id, index);

    const rationaleValid: boolean =
      typeof item.rationale === "string" && item.rationale.trim().length !== 0;
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
function canonicalAdviceValue (value: unknown): unknown {
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

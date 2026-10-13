import type { IAutoMovieContractRule } from "./IAutoMovieContractRule";
import type { AutoMovieContractRuleApplication } from "./AutoMovieContractRuleApplication";


/**
 * Selects active structured rules at one exact safe application boundary.
 *
 * Held and rejected rules remain available in the complete reader DTO for
 * review and diagnostics, but can never enter an executable rule population.
 * A rule is not promoted earlier or later than its declared application.
 *
 *
 * @evidence contracts/common.md#principled-implementation An explicit application union is admitted before filtering active rules whose declared safeApplication equals that boundary.
 * @evidence contracts/common.md#clear-and-simple-design Selection owns lifecycle and timing admission while the reader retains held and rejected records for human inspection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Held and rejected rules never enter the executable population, and no earlier or later boundary substitutes for exact routing.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes complete inventory from executable selection and names exact application semantics.
 * @evidence contracts/performance.md#efficient-algorithms For R rules, one filter costs O(R) time and at most O(R) references in the result.
 * @evidence contracts/performance.md#reuse-equivalent-work Validated rule records are reused by reference; selection does not reread or reparse the contract tree.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned array retains selected caller-owned records, with no additional source strings or file handles.
 */
export function selectAutoMovieContractRules(
  rules: readonly IAutoMovieContractRule[],
  application: AutoMovieContractRuleApplication,
): readonly IAutoMovieContractRule[] {
  if (
    ![
      "composition-safe",
      "observation-only",
      "population-distribution",
      "post-draft-frequency",
      "revision-only",
    ].includes(application)
  )
    throw new Error(
      `Unsupported contract rule application ${String(application)}.`,
    );
  return rules.filter(
    (rule: IAutoMovieContractRule) : boolean =>
      rule.metadata.status === "active" &&
      rule.metadata.safeApplication === application,
  );
}

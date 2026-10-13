import {
  IAutoMovieDesignComparison,
  IAutoMovieDesignDecision,
  IAutoMovieDesignLineage,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { compareDesignVariants } from "./compareDesignVariants";
import { requireValidDesignLineage } from "./requireValidDesignLineage";

/**
 * Compare every pair of alternatives one decision holds open.
 *
 * Pairs come out in ascending option order so a three-way study reads the same
 * way twice. A settled decision is compared exactly like an open one: the
 * rejected schemes are still on the record, and the reason a choice was made is
 * the comparison that produced it.
 *
 * Each pair puts the lower option id on the left and is the same comparison
 * {@link designLineageCompare} answers for it. The lineage is validated once
 * for the whole decision. An invalid lineage, a decision id the lineage does
 * not declare, or options on different base revisions throws an `Error`.
 *
 * @param lineage Lineage declaring the decision.
 * @param decision Id of the decision whose options are compared.
 * @returns One comparison per unordered option pair, k(k-1)/2 for k options.
 *
 * @evidence contracts/common.md#principled-implementation Enumerates the unordered pairs of the code-unit-sorted options with `i < j`, so every pair appears once with the lower id on the left, and answers each with `compareDesignVariants` on the lineage validated once up front.
 * @evidence contracts/common.md#clear-and-simple-design Shares the pair comparison body with `designLineageCompare` through `compareDesignVariants`, and owns only the decision lookup and the pair enumeration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no decision or option; a settled decision is compared like an open one because the contract keeps rejected schemes on the record.
 * @evidence contracts/common.md#meaningful-documentation States the pair order and side rule, why settled decisions are included, the single validation, the pair count, and every thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms One validation of the lineage, then k(k-1)/2 pair comparisons, which is the size of the answer; validating once instead of once per pair removes k(k-1)/2 - 1 redundant full validations.
 * @evidence contracts/performance.md#reuse-equivalent-work The one validation result is shared by every pair of the decision, because each pair reads the same unmodified lineage within one synchronous call; nothing is reused across calls, since the caller may change the record between them.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the sorted option list only for the call; the caller owns the returned comparisons.
 */
export const designLineageDecisionComparisons = (
  lineage: IAutoMovieDesignLineage,
  decision: string,
): IAutoMovieDesignComparison[] => {
  requireValidDesignLineage(lineage);
  const found: IAutoMovieDesignDecision | undefined = lineage.decisions.find(
    (candidate: IAutoMovieDesignDecision): boolean => candidate.id === decision,
  );
  if (found === undefined)
    throw new Error(
      `design lineage "${lineage.id}" has no decision "${decision}"`,
    );
  const options: string[] = [...found.options].sort(compareCodeUnits);
  const comparisons: IAutoMovieDesignComparison[] = [];
  for (let index: number = 0; index < options.length; ++index)
    for (let other: number = index + 1; other < options.length; ++other)
      comparisons.push(
        compareDesignVariants(lineage, options[index]!, options[other]!),
      );
  return comparisons;
};

import {
  IAutoMovieDesignComparison,
  IAutoMovieDesignLineage,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { designLineageCompare } from "./designLineageCompare";
import { validateDesignLineage } from "./validateDesignLineage";

/**
 * Compare every pair of alternatives one decision holds open.
 *
 * Pairs come out in ascending option order so a three-way study reads the same
 * way twice. A settled decision is compared exactly like an open one: the
 * rejected schemes are still on the record, and the reason a choice was made is
 * the comparison that produced it.
 *
 * Each pair puts the lower option id on the left. An invalid lineage or a
 * decision id the lineage does not declare throws an `Error`.
 *
 * @param lineage Lineage declaring the decision.
 * @param decision Id of the decision whose options are compared.
 * @returns One comparison per unordered option pair, k(k-1)/2 for k options.
 */
export const designLineageDecisionComparisons = (
  lineage: IAutoMovieDesignLineage,
  decision: string,
): IAutoMovieDesignComparison[] => {
  requireValidLineage(lineage);
  const found = lineage.decisions.find(
    (candidate) => candidate.id === decision,
  );
  if (found === undefined)
    throw new Error(
      `design lineage "${lineage.id}" has no decision "${decision}"`,
    );
  const options = [...found.options].sort(compareCodeUnits);
  const comparisons: IAutoMovieDesignComparison[] = [];
  for (let index = 0; index < options.length; ++index)
    for (let other = index + 1; other < options.length; ++other)
      comparisons.push(
        designLineageCompare(lineage, options[index]!, options[other]!),
      );
  return comparisons;
};

const requireValidLineage = (lineage: IAutoMovieDesignLineage): void => {
  const validated = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
};

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
 * {@link designLineageCompare} answers for it. The lineage is validated once for
 * the whole decision. An invalid lineage, a decision id the lineage does not
 * declare, or options on different base revisions throws an `Error`.
 *
 * @param lineage Lineage declaring the decision.
 * @param decision Id of the decision whose options are compared.
 * @returns One comparison per unordered option pair, k(k-1)/2 for k options.
 */
export function designLineageDecisionComparisons(
  lineage: IAutoMovieDesignLineage,
  decision: string,
): IAutoMovieDesignComparison[] {
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
}

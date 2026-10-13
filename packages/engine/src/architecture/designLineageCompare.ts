import {
  IAutoMovieDesignComparison,
  IAutoMovieDesignLineage,
} from "@automovie/interface";

import { compareDesignVariants } from "./compareDesignVariants";
import { requireValidDesignLineage } from "./requireValidDesignLineage";

/**
 * Compare two alternatives on the revision they share.
 *
 * Every difference names one subject id both schemes carry, which is the proof
 * that comparing alternatives did not fork the building. Alternatives on
 * different base revisions are refused rather than compared, because the
 * differences would then mix the two schemes with everything the revision
 * changed underneath them.
 *
 * A difference whose `left` or `right` is null means that alternative leaves
 * the aspect at the base revision. Differences are ordered by subject and then
 * aspect in UTF-16 code-unit order, and `common` lists, in the same order,
 * every lineage subject neither alternative changes. The lineage is validated
 * first, and an invalid lineage, an unknown variant id, or two variants on
 * different base revisions throws an `Error`.
 *
 * @param lineage Lineage holding both alternatives.
 * @param left Id of the variant reported on the `left` side.
 * @param right Id of the variant reported on the `right` side.
 * @returns The shared revision, both ids, the untouched subjects, and every differing (subject, aspect) pair.
 *
 * @evidence contracts/common.md#principled-implementation Validates the lineage with `requireValidDesignLineage` and then answers with `compareDesignVariants`, whose keyed change comparison relies on unique change keys and resolvable variants, the two facts this call's validation establishes.
 * @evidence contracts/common.md#clear-and-simple-design The public entry is the validation guard plus one delegation, so the pair comparison and the per-decision comparison share a single body.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no lineage or variant; an invalid lineage is refused rather than compared on whatever resolves.
 * @evidence contracts/common.md#meaningful-documentation States the shared-subject guarantee, why different revisions are refused, the null-side meaning, both orders, what `common` lists, and every thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms One validation linear in the lineage's records, then the comparison's O(C + D log D + S log S) over the two variants' C changes, D differences and S subjects.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one pair per call from the caller's mutable record; a caller comparing every option of a decision uses `designLineageDecisionComparisons`, which validates once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned comparison.
 */
export const designLineageCompare = (
  lineage: IAutoMovieDesignLineage,
  left: string,
  right: string,
): IAutoMovieDesignComparison => {
  requireValidDesignLineage(lineage);
  return compareDesignVariants(lineage, left, right);
};

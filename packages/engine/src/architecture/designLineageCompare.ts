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
 * @returns The shared revision, both ids, the untouched subjects, and every
 *   differing (subject, aspect) pair.
 */
export const designLineageCompare: (
  lineage: IAutoMovieDesignLineage,
  left: string,
  right: string,
) => IAutoMovieDesignComparison = (
  lineage: IAutoMovieDesignLineage,
  left: string,
  right: string,
): IAutoMovieDesignComparison => {
  requireValidDesignLineage(lineage);
  return compareDesignVariants(lineage, left, right);
};

import { IAutoMovieDesignDifference } from "./IAutoMovieDesignDifference";

/**
 * The result of comparing two alternatives on their common basis.
 *
 * Both alternatives must apply to the same revision, so the comparison is
 * between two schemes and not between two buildings. Every difference names a
 * lineage subject id both schemes share, which shows that identity survived
 * the alternative.
 *
 * A subject both alternatives edit to identical values appears in neither
 * {@link common} nor {@link differences}. Both lists sort by UTF-16 code unit,
 * never by locale.
 *
 * @evidence contracts/common.md#principled-implementation `designLineageCompare` keys each variant's changes by subject and aspect, keeps every key whose two verbatim values differ, and sorts by UTF-16 code unit so the result is identical on every host and locale.
 * @evidence contracts/common.md#clear-and-simple-design The shared revision, both variant ids, the untouched subjects, and the differences are returned together, so a reader can check the comparison's basis and its complement from one record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Variants on different base revisions and an invalid lineage throw instead of being compared, and subjects edited identically by both sides are left out of both lists as documented rather than counted as common.
 * @evidence contracts/common.md#meaningful-documentation States the shared-revision requirement, what lands in `common` versus `differences`, the omission of identically edited subjects, the code-unit ordering, and which side each variant id is reported on.
 * @author Samchon
 */
export interface IAutoMovieDesignComparison {
  /** Base revision both alternatives apply to. */
  revision: string;

  /** Id of the variant reported on each difference's `left` side. */
  left: string;

  /** Id of the variant reported on each difference's `right` side. */
  right: string;

  /** Lineage subject ids neither alternative edits, in ascending order. */
  common: string[];

  /** Every differing subject and aspect, ordered by subject, then aspect. */
  differences: IAutoMovieDesignDifference[];
}

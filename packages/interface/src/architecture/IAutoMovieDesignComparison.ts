import { IAutoMovieDesignDifference } from "./IAutoMovieDesignDifference";

/**
 * The result of comparing two alternatives on their common basis.
 *
 * Both alternatives must apply to the same revision, so the comparison is
 * between two schemes and not between two buildings. Every difference names a
 * subject id both schemes share, which is the mechanical proof that identity
 * survived the alternative.
 *
 * A subject both alternatives edit to identical values appears in neither
 * {@link common} nor {@link differences}. Both lists sort by UTF-16 code unit,
 * never by locale.
 *
 * @evidence contracts/common.md#principled-implementation Produced by `designLineageCompare`, which validates the lineage, refuses variants on different base revisions, keys each change by length-prefixed subject and aspect, and keeps only keys whose two values are not strictly equal; validation already guarantees one change per key per variant.
 * @evidence contracts/common.md#clear-and-simple-design A result record holding both variant ids, their shared revision, and two sorted lists; it carries no base values because lineage never reads the edited graph.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or aspect is filtered or privileged; ordering uses `compareCodeUnits` rather than locale collation, so the same lineage compares identically on every host.
 * @evidence contracts/common.md#meaningful-documentation States the same-revision rule, what `common` holds, the identical-edit case that lands in neither list, and the code-unit ordering of both lists.
 * @author Samchon
 */
export interface IAutoMovieDesignComparison {
  /** Base revision both alternatives apply to. */
  revision: string;

  /** Left variant id. */
  left: string;

  /** Right variant id. */
  right: string;

  /** Subject ids neither alternative edits, in ascending order. */
  common: string[];

  /** Every differing subject and aspect, in ascending order. */
  differences: IAutoMovieDesignDifference[];
}

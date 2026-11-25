import type { IAutoMovieDesignDifference } from "./IAutoMovieDesignDifference";

/**
 * The result of comparing two alternatives on their common basis.
 *
 * Both alternatives must apply to the same revision, so the comparison is
 * between two schemes and not between two buildings. Every difference names a
 * lineage subject id both schemes share, which shows that identity survived the
 * alternative.
 *
 * A subject both alternatives edit to identical values appears in neither
 * {@link common} nor {@link differences}. Both lists sort by UTF-16 code unit,
 * never by locale.
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

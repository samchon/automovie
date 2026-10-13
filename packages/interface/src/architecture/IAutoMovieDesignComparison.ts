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

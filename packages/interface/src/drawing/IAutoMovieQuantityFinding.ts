import type { AutoMovieQuantityBasis } from "./AutoMovieQuantityBasis";
import type { AutoMovieQuantitySubject } from "./AutoMovieQuantitySubject";
import type { AutoMovieQuantityUnit } from "./AutoMovieQuantityUnit";
import type { IAutoMovieQuantityContributor } from "./IAutoMovieQuantityContributor";

/**
 * Everything the design says about one measured subject.
 *
 * The total covers all owners that contributed to the numeric tally, including
 * owners omitted from the bounded named prefix. The contributor bound limits
 * returned owner records, not gap text, prior measurement work or missing
 * geometry; gaps can identify records that never contributed a value.
 *
 * The basis is decided per subject: `space-volume` is always `approximate`,
 * because a volume stated as overlapping cells is summed rather than unioned,
 * and every other subject is `exact`.
 */
export interface IAutoMovieQuantityFinding {
  /** Subject this finding answers for. */
  subject: AutoMovieQuantitySubject;

  /** Unit of measured values; owner counts remain dimensionless. */
  unit: AutoMovieQuantityUnit;

  /**
   * Sum of every owner's value, whether or not the bound named it, rounded to
   * six decimals; `0` when no owner contributed.
   */
  total: number;

  /** How many distinct owners contributed. */
  owners: number;

  /** Fixed per-subject method label; not a numerical accuracy certificate. */
  basis: AutoMovieQuantityBasis;

  /**
   * The specific modelling limit that makes the total approximate, or `null`
   * when it is exact, so a reader can decide whether it matters for what they
   * are about to order.
   */
  approximation: string | null;

  /**
   * Dominant owners, descending by value and then ascending by owner id.
   *
   * The id tiebreak makes the list a property of the design rather than of
   * graph walk order, so two derivations of one revision name the same owners.
   */
  contributors: IAutoMovieQuantityContributor[];

  /** Owners the bound left out; `owners` minus `contributors.length`. */
  omittedOwners: number;

  /** Sum of the values of the owners the bound left out. */
  omittedValue: number;
}

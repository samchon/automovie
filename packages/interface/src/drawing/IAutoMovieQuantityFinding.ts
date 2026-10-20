import { AutoMovieQuantityBasis } from "./AutoMovieQuantityBasis";
import { AutoMovieQuantitySubject } from "./AutoMovieQuantitySubject";
import { AutoMovieQuantityUnit } from "./AutoMovieQuantityUnit";
import { IAutoMovieQuantityContributor } from "./IAutoMovieQuantityContributor";

/**
 * Everything the design says about one measured subject.
 *
 * The total covers all owners that contributed to the numeric tally, including owners omitted from the bounded named prefix. The contributor bound limits returned owner records, not gap text, prior measurement work or missing geometry; gaps can identify records that never contributed a value.
 *
 * The basis is decided per subject: `space-volume` is always `approximate`,
 * because a volume stated as overlapping cells is summed rather than unioned,
 * and every other subject is `exact`.
 *
 * @evidence contracts/common.md#principled-implementation Owner accumulations round to six decimals, sort by value descending then id, and feed total and omitted suffix sums before final rounding. The contributor limit does not change the total; binary64 summation and rounding mean reconciliation is numerical rather than exact algebra, with overflow refused later by canonical encoding.
 * @evidence contracts/common.md#clear-and-simple-design One finding per subject carries the unit, basis and approximation once, with a bounded owner list and two remainder fields, so a reader reconciles a subject without another lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis is fixed per subject by the measurement and the approximation text is the constant `AUTOMOVIE_QUANTITY_CELL_UNION_APPROXIMATION`, rather than a hedge chosen per design, and an owner beyond the bound is counted instead of discarded.
 * @evidence contracts/common.md#meaningful-documentation States the total's coverage, the contributor bound and its remainder, and the per-subject basis; members give the unit's scope, the owner count, when `approximation` is `null`, the contributor order and tiebreak, and what the two remainder fields count.
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

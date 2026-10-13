import { AutoMovieQuantityBasis } from "./AutoMovieQuantityBasis";
import { AutoMovieQuantitySubject } from "./AutoMovieQuantitySubject";
import { AutoMovieQuantityUnit } from "./AutoMovieQuantityUnit";
import { IAutoMovieQuantityContributor } from "./IAutoMovieQuantityContributor";

/**
 * Everything the design says about one measured subject.
 *
 * The total covers every owner. The named owners are bounded by the
 * measurement's contributor bound, which defaults to the engine's
 * `AUTOMOVIE_QUANTITY_MAX_CONTRIBUTORS`, and what the bound left out is counted
 * and summed rather than dropped, so a take-off over a tower is the same size
 * as one over a room and still reconciles.
 *
 * The basis is decided per subject: `space-volume` is always `approximate`,
 * because a volume stated as overlapping cells is summed rather than unioned,
 * and every other subject is `exact`.
 *
 * @evidence contracts/common.md#principled-implementation `measureAutoMovieQuantities` rounds each owner's sum, sorts owners by value descending then id with `compareAutoMovieRenderIds`, totals every rounded value before slicing off the first `maxContributors`, and sums the rest into `omittedValue`, so `total` equals the named values plus `omittedValue` up to the final rounding.
 * @evidence contracts/common.md#clear-and-simple-design One finding per subject carries the unit, basis and approximation once, with a bounded owner list and two remainder fields, so a reader reconciles a subject without another lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis is fixed per subject by the measurement and the approximation text is the constant `AUTOMOVIE_QUANTITY_CELL_UNION_APPROXIMATION`, rather than a hedge chosen per design, and an owner beyond the bound is counted instead of discarded.
 * @evidence contracts/common.md#meaningful-documentation States the total's coverage, the contributor bound and its remainder, and the per-subject basis; members give the unit's scope, the owner count, when `approximation` is `null`, the contributor order and tiebreak, and what the two remainder fields count.
 * @author Samchon
 */
export interface IAutoMovieQuantityFinding {
  /** Subject this finding answers for. */
  subject: AutoMovieQuantitySubject;

  /** Unit of every number in this finding. */
  unit: AutoMovieQuantityUnit;

  /**
   * Sum of every owner's value, whether or not the bound named it, rounded to
   * six decimals; `0` when no owner contributed.
   */
  total: number;

  /** How many distinct owners contributed. */
  owners: number;

  /** Whether the total is the design's own arithmetic or an approximation. */
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

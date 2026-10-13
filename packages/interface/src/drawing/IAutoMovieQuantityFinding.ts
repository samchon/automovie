import { AutoMovieQuantityBasis } from "./AutoMovieQuantityBasis";
import { AutoMovieQuantitySubject } from "./AutoMovieQuantitySubject";
import { AutoMovieQuantityUnit } from "./AutoMovieQuantityUnit";
import { IAutoMovieQuantityContributor } from "./IAutoMovieQuantityContributor";

/**
 * Everything the design says about one measured subject.
 *
 * The total is exact and covers every owner. The named owners are bounded by
 * {@link AUTOMOVIE_QUANTITY_MAX_CONTRIBUTORS}, and what the bound left out is
 * counted and summed rather than dropped, so a take-off over a fifty-storey
 * tower is the same size as one over a single room and still adds up. An
 * unbounded list would be a second copy of the model wearing a total, and the
 * one artifact somebody orders material from would become the one nobody
 * reads.
 *
 * The basis is decided per subject: `space-volume` is always `approximate`,
 * because a volume stated as overlapping cells is summed rather than unioned,
 * and every other subject is `exact`.
 *
 * @evidence contracts/common.md#principled-implementation `finish` rounds each owner's sum, sorts by value descending and then owner by UTF-16 code unit, keeps the first `maxContributors` (default `AUTOMOVIE_QUANTITY_MAX_CONTRIBUTORS`, 8) and folds the rest into `omittedOwners` and `omittedValue`; `total` sums every rounded owner value before the cut, so named plus omitted reconciles with it up to the final rounding.
 * @evidence contracts/common.md#clear-and-simple-design Total, owner count, basis, bounded contributors and the omitted tallies share one record per subject, so a reader reconciles the take-off without a second list or a lookup into the report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis is a subject-level constant rather than per-measurement detection: `space-volume` is labelled `approximate` with the cell-union explanation even when every space is a shell measured exactly, which overstates uncertainty but never understates it.
 * @evidence contracts/common.md#meaningful-documentation States the owner bound and how left-out owners are counted and summed, the deterministic tie-break, which subject is approximate and why, that `approximation` is `null` when exact, and that every number uses `unit`.
 * @author Samchon
 */
export interface IAutoMovieQuantityFinding {
  /** Subject this finding answers for. */
  subject: AutoMovieQuantitySubject;

  /** Unit of every number in this finding. */
  unit: AutoMovieQuantityUnit;

  /** Exact total over every owner, whether or not the bound named it. */
  total: number;

  /** How many owners contributed at all. */
  owners: number;

  /** Whether the total is the design's own arithmetic or an approximation. */
  basis: AutoMovieQuantityBasis;

  /**
   * Exactly what makes the total approximate, or `null` when it is exact.
   *
   * Never a hedge. It names the specific modelling limit that produced the
   * error, so a reader can decide whether it matters for what they are about to
   * order.
   */
  approximation: string | null;

  /**
   * Dominant owners, descending by value then ascending by owner id.
   *
   * Ties break on the id so the list is a property of the design rather than of
   * the order the graph happened to be walked, which is what makes two
   * derivations of one revision produce the same names.
   */
  contributors: IAutoMovieQuantityContributor[];

  /** Owners the bound left out. */
  omittedOwners: number;

  /** Total carried by the owners the bound left out. */
  omittedValue: number;
}

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

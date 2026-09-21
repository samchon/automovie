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
 * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `IAutoMovieQuantityFinding` as the portable data boundary for the building exterior schedules quantities requirement.
 * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `IAutoMovieQuantityFinding` for the building envelope deliverable quantity invariant system contract.
 * @author Samchon
 */
export interface IAutoMovieQuantityFinding {
  /**
   * Subject this finding answers for.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `subject` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `subject` for the building envelope deliverable quantity invariant system contract.
   */
  subject: AutoMovieQuantitySubject;

  /**
   * Unit of every number in this finding.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `unit` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `unit` for the building envelope deliverable quantity invariant system contract.
   */
  unit: AutoMovieQuantityUnit;

  /**
   * Exact total over every owner, whether or not the bound named it.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `total` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `total` for the building envelope deliverable quantity invariant system contract.
   */
  total: number;

  /**
   * How many owners contributed at all.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `owners` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `owners` for the building envelope deliverable quantity invariant system contract.
   */
  owners: number;

  /**
   * Whether the total is the design's own arithmetic or an approximation.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `basis` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `basis` for the building envelope deliverable quantity invariant system contract.
   */
  basis: AutoMovieQuantityBasis;

  /**
   * Exactly what makes the total approximate, or `null` when it is exact.
   *
   * Never a hedge. It names the specific modelling limit that produced the
   * error, so a reader can decide whether it matters for what they are about to
   * order.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `approximation` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `approximation` for the building envelope deliverable quantity invariant system contract.
   */
  approximation: string | null;

  /**
   * Dominant owners, descending by value then ascending by owner id.
   *
   * Ties break on the id so the list is a property of the design rather than of
   * the order the graph happened to be walked, which is what makes two
   * derivations of one revision produce the same names.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `contributors` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `contributors` for the building envelope deliverable quantity invariant system contract.
   */
  contributors: IAutoMovieQuantityContributor[];

  /**
   * Owners the bound left out.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `omittedOwners` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `omittedOwners` for the building envelope deliverable quantity invariant system contract.
   */
  omittedOwners: number;

  /**
   * Total carried by the owners the bound left out.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `omittedValue` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `omittedValue` for the building envelope deliverable quantity invariant system contract.
   */
  omittedValue: number;
}

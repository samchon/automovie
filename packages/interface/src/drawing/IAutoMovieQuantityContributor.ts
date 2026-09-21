/**
 * One owner's share of one measured subject.
 *
 * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `IAutoMovieQuantityContributor` as the portable data boundary for the building exterior schedules quantities requirement.
 * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `IAutoMovieQuantityContributor` for the building envelope deliverable quantity invariant system contract.
 */
export interface IAutoMovieQuantityContributor {
  /**
   * Design id the quantity is attributed to: a space, opening, kind or model.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `owner` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `owner` for the building envelope deliverable quantity invariant system contract.
   */
  owner: string;

  /**
   * That owner's exact contribution, in the subject's unit.
   *
   * @evidence requirements/building-exterior/deliverables.md#building-exterior-schedules-quantities Exposes `value` as the portable data boundary for the building exterior schedules quantities requirement.
   * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-deliverable-quantity-invariant Types `value` for the building envelope deliverable quantity invariant system contract.
   */
  value: number;
}

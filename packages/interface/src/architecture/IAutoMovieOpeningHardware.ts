/**
 * One fixed, non-travelling member an opening carries.
 *
 * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `IAutoMovieOpeningHardware` as the portable data boundary for the building opening form layout requirement.
 * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `IAutoMovieOpeningHardware` for the building envelope opening cut input output system contract.
 */
export interface IAutoMovieOpeningHardware {
  /**
   * Stable hardware identity within the opening.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `id` as the portable data boundary for the building opening form layout requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `id` for the building envelope opening cut input output system contract.
   */
  id: string;
  /**
   * Open semantic label such as `frame`, `hinge`, `handle`, or `track`.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `kind` as the portable data boundary for the building opening form layout requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `kind` for the building envelope opening cut input output system contract.
   */
  kind: string;
  /**
   * Visible element realizing it, or null when it is only declared.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `element` as the portable data boundary for the building opening form layout requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `element` for the building envelope opening cut input output system contract.
   */
  element: string | null;
}

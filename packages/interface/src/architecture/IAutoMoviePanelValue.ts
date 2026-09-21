/**
 * The travel one named state gives one panel.
 *
 * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state Exposes `IAutoMoviePanelValue` as the portable data boundary for the building opening operable state requirement.
 * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant Types `IAutoMoviePanelValue` for the building envelope opening operable sweep invariant system contract.
 */
export interface IAutoMoviePanelValue {
  /**
   * Panel id inside the same operation.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state Exposes `panel` as the portable data boundary for the building opening operable state requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant Types `panel` for the building envelope opening operable sweep invariant system contract.
   */
  panel: string;

  /**
   * Radians for a revolute panel, metres for a prismatic one.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state Exposes `value` as the portable data boundary for the building opening operable state requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant Types `value` for the building envelope opening operable sweep invariant system contract.
   */
  value: number;
}

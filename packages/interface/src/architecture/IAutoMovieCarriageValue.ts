/**
 * The travel one named state gives one carriage.
 *
 * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state Exposes `IAutoMovieCarriageValue` as the portable data boundary for the building opening operable state requirement.
 * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant Types `IAutoMovieCarriageValue` for the building envelope opening operable sweep invariant system contract.
 */
export interface IAutoMovieCarriageValue {
  /**
   * Carriage id inside the same operation.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state Exposes `carriage` as the portable data boundary for the building opening operable state requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant Types `carriage` for the building envelope opening operable sweep invariant system contract.
   */
  carriage: string;

  /**
   * Radians for a revolute carriage, metres for a prismatic one.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state Exposes `value` as the portable data boundary for the building opening operable state requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant Types `value` for the building envelope opening operable sweep invariant system contract.
   */
  value: number;

  /**
   * Logical space this carriage stands at under this state, or null.
   *
   * It names an endpoint of the run or one of its
   * {@link IAutoMovieBuiltConnector.landings}, and the element the carriage
   * drives must actually be inside that space once the state is applied. That
   * is what makes "the car is at level three" a fact the engine settles rather
   * than a label beside a number: a counterweight travelling the other way
   * simply serves nothing and says so.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state Exposes `serves` as the portable data boundary for the building opening operable state requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant Types `serves` for the building envelope opening operable sweep invariant system contract.
   */
  serves: string | null;
}

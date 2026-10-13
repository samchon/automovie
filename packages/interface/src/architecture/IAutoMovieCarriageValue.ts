/** The travel one named state gives one carriage. */
export interface IAutoMovieCarriageValue {
  /** Carriage id inside the same operation; listed once per state. */
  carriage: string;

  /**
   * Radians for a revolute carriage, metres for a prismatic one, within the
   * carriage's motion range.
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
   * The engine tests the driven element's world origin, with every other
   * member at its current state, and skips the test when neither the space nor
   * any space below it states a volume.
   */
  serves: string | null;
}

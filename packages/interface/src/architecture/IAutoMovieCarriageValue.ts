/**
 * The travel one named state gives one carriage.
 *
 * @evidence contracts/common.md#principled-implementation A state assigns each carriage a value inside its motion range; when `serves` names a space whose subtree states a volume, validation composes the work's world matrices under that state and tests the driven element's origin with `builtEnvironmentContainsPoint`.
 * @evidence contracts/common.md#clear-and-simple-design One value per carriage per state, keyed by carriage id, keeps operating states as lookup tables rather than motion scripts with timing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A served space whose subtree states no volume is skipped instead of failed, and the check tests only the element's origin, not its whole body, so a car straddling a floor line can pass.
 * @evidence contracts/common.md#meaningful-documentation States the unit by motion kind, the stops `serves` may name, the null meaning, and exactly which point the engine tests and when it skips.
 */
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

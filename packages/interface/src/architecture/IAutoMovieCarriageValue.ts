/** The travel one named state gives one carriage, and the stop it claims. */
export interface IAutoMovieCarriageValue {
  /**
   * Carriage id inside the same operation; every carriage is listed exactly
   * once per state.
   */
  carriage: string;

  /**
   * Displacement from the rest pose: radians for a revolute carriage, metres
   * along the unit axis for a prismatic one, within the carriage's motion
   * range.
   */
  value: number;

  /**
   * Logical space this carriage stands at under this state, or null when it
   * claims no stop, as a counterweight travelling the other way does.
   *
   * Names an endpoint or one of the connector's
   * {@link IAutoMovieBuiltConnector.landings}. The service check requires the
   * driven element's world origin to lie in that space's stated subtree union,
   * not its entire mesh or occupancy box; it does not measure boarding access
   * or route alignment.
   *
   * Validation tests the driven element's world origin, with this state's other
   * carriages at their values and every other moving member at its current
   * state, and skips the test when neither the space nor any space below it
   * states a volume.
   */
  serves: string | null;
}

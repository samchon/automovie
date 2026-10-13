/**
 * The travel one named state gives one carriage, and the stop it claims.
 *
 * @evidence contracts/common.md#principled-implementation The value is a displacement from the driven element's rest pose along the carriage's one degree of freedom, and a stated stop is settled by placing the element under this state and testing its world origin with the same containment query every space consumer uses.
 * @evidence contracts/common.md#clear-and-simple-design A carriage reference, one scalar, and one nullable stop are the whole per-carriage entry, so a state is a flat list of these and the run's direction stays on the state rather than on each value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stop is checked only when the served space or a descendant states a volume, the documented rule for semantic containers, and `null` is the declared way for a counterweight to claim no stop rather than an exemption by carriage name.
 * @evidence contracts/common.md#meaningful-documentation States that the carriage is listed once per state, the radian and metre units of the value and its range, which spaces `serves` may name, how the stop is tested, when the test is skipped, and what null means.
 * @author Samchon
 */
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
   * It names an endpoint of the run or one of its
   * {@link IAutoMovieBuiltConnector.landings}, and the element the carriage
   * drives must be inside that space once the state is applied, so "the car is
   * at level three" is a fact validation settles rather than a label.
   *
   * Validation tests the driven element's world origin, with this state's
   * other carriages at their values and every other moving member at its
   * current state, and skips the test when neither the space nor any space
   * below it states a volume.
   */
  serves: string | null;
}

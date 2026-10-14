import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";

/**
 * The resolved measurements of one admitted person, the only record modeling reads.
 *
 * It carries the admitted identity unchanged and the quantities that follow from it by definition, computed once so that admission, the skeleton and every part read the same numbers: a derived value is never recomputed differently by two readers. Lengths stay in millimetres, the identity's unit; modeling converts to the metres of `IAutoMovieModel` in one named step where it emits output.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanMeasurements {
  /** The admitted identity, a private copy that nothing mutates. */
  identity: IAutoMovieHumanIdentity;

  /**
   * Maximum head breadth, eurion to eurion, millimetres: head length times cephalic index over 100, the definition of the index.
   */
  headBreadth: number;

  /**
   * Trochanterion height of the left leg, millimetres: the sum of its thigh length, shank length and lateral malleolus height, by the definitions of those lengths.
   */
  leftTrochanterionHeight: number;

  /** Trochanterion height of the right leg, millimetres, as for the left. */
  rightTrochanterionHeight: number;
}

/** Actual exterior facets' certified one-sided distance to their generating patch, metres.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularDeviationPair {
  /** Shaped reference geometry before its registered gaze transform. */
  rest: number;
  /** Actual performed coordinates after the registered gaze transform. */
  posed: number;
}

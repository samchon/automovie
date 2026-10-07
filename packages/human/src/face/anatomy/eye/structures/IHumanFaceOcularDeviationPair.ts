/** Actual exterior facets' certified one-sided distance to their generating patch, metres.
 *
 *
 * @evidence contracts/common.md#principled-implementation Numerical facet-to-generating-patch bounds for the actual rest and posed exterior, covering binary64 and Float32 copies; no inscription or physical acceptance is asserted.
 * @evidence contracts/common.md#clear-and-simple-design Named members keep the represented quantities and their correspondence in one result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual represented data without a clinical default, hidden tolerance or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Member documentation preserves the numerical meaning, units and ownership required by the consumer.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularDeviationPair {
  /** Shaped reference geometry before its registered gaze transform. */
  rest: number;
  /** Actual performed coordinates after the registered gaze transform. */
  posed: number;
}

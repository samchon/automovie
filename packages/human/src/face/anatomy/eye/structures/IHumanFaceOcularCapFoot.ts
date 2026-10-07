/** One selected cap radius with the complete nearest-distance enclosure.
 *
 *
 * @evidence contracts/common.md#principled-implementation A feasible represented cap radius and nearest-distance enclosure for the represented-input real profile; numerical bounds are not physical acceptance.
 * @evidence contracts/common.md#clear-and-simple-design Named members keep the represented quantities and their correspondence in one result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual represented data without a clinical default, hidden tolerance or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Member documentation preserves the numerical meaning, units and ownership required by the consumer.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularCapFoot {
  /** Feasible selected radial coordinate on the cap, metres; the represented candidate need not be the exact real minimizer. */
  radiusMetres: number;
  /** Global lower bound on nearest distance to the cap, metres, from all endpoint and stationary intervals. */
  lowerDistanceMetres: number;
  /** Upper distance bound of the selected feasible cap candidate, metres. */
  upperDistanceMetres: number;
  /** Factored binary64 height deviation from the same represented-input real polynomial. */
  representationErrorMetres: number;
}

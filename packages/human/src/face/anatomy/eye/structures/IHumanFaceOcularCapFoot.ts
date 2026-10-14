/** One selected cap radius with the complete nearest-distance enclosure.
 *
 *
 * @evidence contracts/common.md#principled-implementation One feasible represented radius accompanies complete lower-distance and selected upper-distance enclosures plus separate rendering representation error.
 * @evidence contracts/common.md#clear-and-simple-design HumanFaceOcularCapMetric owns exact stationary candidate enumeration and numeric conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The selected radius need not equal the exact real minimizer and numeric error is not contact tolerance.
 * @evidence contracts/common.md#meaningful-documentation Fields state metre quantities, global lower bound and separate factored-height representation error.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceOcularCapFoot is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceOcularCapFoot declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceOcularCapFoot itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
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

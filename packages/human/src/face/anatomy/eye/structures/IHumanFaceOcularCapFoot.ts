/** One selected cap radius with the complete nearest-distance enclosure.
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

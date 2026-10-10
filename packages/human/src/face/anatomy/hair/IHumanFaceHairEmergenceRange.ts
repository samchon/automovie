/**
 * The exit elevations, in degrees above the scalp's tangent plane, that the
 * cited placement guide allows at one root.
 *
 * `lowest` is the convention the emergence owner uses for every root; it is
 * the lower end of the guide's range, blended from the frontal hairline to
 * the mid scalp by the hairline coverage. `highest` is the same blend of the
 * range tops. A root keeps `lowest` unless its stem provably cannot clear the
 * skin from it.
 *
 * @author Samchon
 */
export interface IHumanFaceHairEmergenceRange {
  /** Lower end of the cited range at this root: the emergence convention. */
  lowest: number;

  /** Upper end of the cited range at this root (Shapiro & Shapiro 2013 range top). */
  highest: number;
}

/**
 * The best head solve candidate seen so far: its merit, channel weights and
 * the head readings at those weights.
 *
 * @author Samchon
 */
export interface IHumanPersonHeadCandidate {
  /** Sum of squared relative residuals of the primary measurements. */
  merit: number;

  /** Channel weights in the solve's channel order. */
  weights: number[];

  /** Head readings at those weights, metres, in the solve's reading order. */
  readings: number[];
}

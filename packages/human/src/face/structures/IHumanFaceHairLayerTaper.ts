/**
 * Relative ribbon narrowing of a connected numerical hair layer.
 * Population density still owns root width; these coefficients do not author it.
 *
 * @author Samchon
 */
export interface IHumanFaceHairLayerTaper {
  /** Positive tip/root width ratio in [0.05,1]. */
  tipWidth: number;

  /** Centreline fraction at which taper starts, in [0,0.95]. */
  start: number;
}

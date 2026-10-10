/**
 * Polar hairline mask of a connected numerical hair layer.
 * Squared azimuth weights blend the four angles and only reduce shared growth.
 *
 * @author Samchon
 */
export interface IHumanFaceHairLayerHairline {
  /** Anterior polar angle from +Y, in [0,pi] radians. */
  front: number;

  /** Anatomical-left polar angle from +Y, in [0,pi] radians. */
  left: number;

  /** Anatomical-right polar angle from +Y, in [0,pi] radians. */
  right: number;

  /** Posterior polar angle from +Y, in [0,pi] radians. */
  back: number;
}

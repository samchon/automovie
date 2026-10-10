import type { IAutoMovieHumanFaceHair } from "./IAutoMovieHumanFaceHair";

/**
 * Continuous parting field in the connected layer's neutral head frame.
 * The normalized plane, optional Gaussian root envelope and arc decay preserve
 * the existing authored comb convention without a private parting curve.
 *
 * @author Samchon
 */
export interface IHumanFaceHairLayerPart {
  /** Nonzero plane normal, normalized by the field owner. */
  normal: [number, number, number];

  /** Signed plane offset from the neutral origin, metres. */
  offset: number;

  /** Positive tanh transition width, metres. */
  transitionWidth: number;

  /** Dimensionless direction bias projected into the local tangent. */
  bias: [number, number, number];

  /** Nonnegative relative direction weight. */
  strength: number;

  /** Positive exponential decay distance along the lock, metres. */
  reach: number;

  /** Optional neutral root-space Gaussian envelope. */
  region?: IAutoMovieHumanFaceHair.Region;
}

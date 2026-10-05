import type { IAutoMovieHumanFaceLipMarginPair } from "@automovie/human";

/**
 * The lip margin pairs found on one face, with the commissure limit and the
 * station spacing they were found with.
 *
 * @author Samchon
 */
export interface IHumanSourceLipMargin {
  /** Margin pairs, the negative side's stations first. */
  pairs: IAutoMovieHumanFaceLipMarginPair[];

  /** The commissure limit along the jaw axis, metres. */
  limitMetres: number;

  /** Station spacing, metres. */
  stationMetres: number;
}

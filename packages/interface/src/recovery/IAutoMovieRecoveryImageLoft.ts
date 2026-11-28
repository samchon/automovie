import type { IAutoMovieEllipticLoft } from "../model/IAutoMovieEllipticLoft";
import type { IAutoMovieRecoveryDimensionScales } from "./IAutoMovieRecoveryDimensionScales";
import type { IAutoMovieRecoveryImageLoftCoverage } from "./IAutoMovieRecoveryImageLoftCoverage";

/**
 * Open lateral surface recipe with aligned elliptical X/Z sections. Compilation
 * applies width and depth scales about the supplied frame origin and height
 * about the first saved Y station, then produces a bicubic atlas.
 */
export interface IAutoMovieRecoveryImageLoft {
  /** Select the aligned elliptical X/Z section representation. */
  family: "aligned-elliptical-sections";

  /** Recovered object identifier used in the generated model. */
  objectId: string;

  /** Supplied metric frame in which the coefficients were fitted. */
  frame: string;

  /** Unedited section radii, centers, and longitudinal span intervals in metres. */
  loft: IAutoMovieEllipticLoft;

  /**
   * Independent width, depth, and height factors, each in [0.25, 4]. Width and
   * depth scale about the X/Z origin, and height about the first saved Y
   * endpoint.
   */
  dimensions: IAutoMovieRecoveryDimensionScales;

  /**
   * Coverage declaration required to compile the recipe as an inferred open
   * lateral surface.
   */
  coverage: IAutoMovieRecoveryImageLoftCoverage;
}

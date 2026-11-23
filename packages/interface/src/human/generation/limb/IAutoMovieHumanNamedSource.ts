import type { IAutoMovieHumanSourceRealization } from "./IAutoMovieHumanSourceRealization";

/**
 * An actual named builder result, retained even when part or loft admission
 * failed.
 */
export interface IAutoMovieHumanNamedSource {
  /** The requested anatomical name, also available when the result has no part. */
  name: string;
  /**
   * The identical result produced by the source builder; no replacement loft is
   * made.
   */
  result: IAutoMovieHumanSourceRealization;
}

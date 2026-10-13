import { IAutoMoviePatternTextureTransform } from "./IAutoMoviePatternTextureTransform";

/** UV transforms and the occurrences that transform cannot express. */
export interface IAutoMoviePatternTexturing {
  /** One transform per expressible occurrence, in placement order. */
  transforms: IAutoMoviePatternTextureTransform[];
  /**
   * Occurrence ids whose sampling needs a shear the transform has no term for.
   */
  sheared: string[];
}

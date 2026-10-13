import { IAutoMoviePatternTextureTransform } from "./IAutoMoviePatternTextureTransform";

/**
 * UV transforms and the occurrences that transform cannot express.
 *
 * Produced by `autoMoviePatternTextureTransforms` over every placement of the
 * run, whole or cut, whatever its zone's material; each placement lands in
 * exactly one of the two lists. A caller texturing several materials calls
 * once per material and keeps the occurrences of that material's zones.
 *
 * @author Samchon
 */
export interface IAutoMoviePatternTexturing {
  /** One transform per expressible occurrence, in placement order. */
  transforms: IAutoMoviePatternTextureTransform[];

  /**
   * Occurrence ids whose sampling needs a shear the transform has no term for,
   * in placement order.
   */
  sheared: string[];
}

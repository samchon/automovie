import { IAutoMovieFaceChin } from "./IAutoMovieFaceChin";

/**
 * Jaw traits of an {@link IAutoMovieFace}: signed morph weights in `[-2, 2]`,
 * `0`/omitted meaning the template's jaw unchanged. The chin nests here because
 * it is the front of the same mandible. `width` projects onto the unsided
 * `jawWidth` morph target.
 *
 * @author Samchon
 */
export interface IAutoMovieFaceJaw {
  /**
   * Width of the jaw below the cheekbones: `+` square and strong, `-` a slim
   * V-line.
   */
  width?: number;

  /** The chin at the jaw's tip. See {@link IAutoMovieFaceChin}. */
  chin?: IAutoMovieFaceChin;
}

import { IAutoMovieFaceChin } from "./IAutoMovieFaceChin";

/**
 * Jaw traits of an {@link IAutoMovieFace}: signed morph weights in `[-2, 2]`,
 * with `0` or omission leaving the template's jaw unchanged.
 *
 * The chin nests here because it is the front of the same mandible. The jaw is
 * unsided, so `width` drives the single `jawWidth` morph target.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` reads `jaw.width` through its single-target table into `jawWidth` and descends into `chin` for the two chin targets, so each jaw leaf maps to one target and is range-checked at its own document path.
 * @evidence contracts/common.md#clear-and-simple-design The jaw group holds its one direct trait and the nested chin record, mirroring the mandible's anatomy without inventing a sided shape for a midline bone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `width` gets no handling beyond the shared range check in `validateFace` and the linear morph in `morphFace`, and an omitted `chin` simply contributes no traits.
 * @evidence contracts/common.md#meaningful-documentation States the weight range and neutral meaning, why the chin nests under the jaw, that the jaw is unsided, and the `jawWidth` target; the member gives each sign's look.
 * @author Samchon
 */
export interface IAutoMovieFaceJaw {
  /**
   * Width of the jaw below the cheekbones: `+` square and strong, `-` a slim
   * V-line.
   */
  width?: number;

  /** The chin at the jaw's tip. */
  chin?: IAutoMovieFaceChin;
}

import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";
import { IAutoMovieFaceChin } from "./IAutoMovieFaceChin";

/**
 * Jaw traits of an {@link IAutoMovieFace}: signed morph weights in `[-2, 2]`,
 * `0`/omitted meaning the template's jaw unchanged. The chin nests here because
 * it is the front of the same mandible. `width` projects onto the unsided
 * `jawWidth` morph target.
 *
 * @evidence contracts/common.md#principled-implementation `width` projects onto the single `jawWidth` target and `chin` nests the chin leaves, all read by `flattenFace` at their document paths and applied as additive template deltas.
 * @evidence contracts/common.md#clear-and-simple-design Groups the mandible's width with its front, so a request such as a narrower jaw with a longer chin edits one subtree of the document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The jaw width is a midline trait with no side rule or derived value; it passes through its `SINGLE` table entry as written.
 * @evidence contracts/common.md#meaningful-documentation Gives the range, the unchanged meaning of omission, why the chin nests here, the target name, and that positive width squares the jaw while negative slims it.
 * @author Samchon
 */
export interface IAutoMovieFaceJaw {
  /**
   * Width of the jaw below the cheekbones: `+` square and strong, `-` a slim
   * V-line.
   */
  width?: AutoMovieFaceWeight;

  /** The chin at the jaw's tip. See {@link IAutoMovieFaceChin}. */
  chin?: IAutoMovieFaceChin;
}

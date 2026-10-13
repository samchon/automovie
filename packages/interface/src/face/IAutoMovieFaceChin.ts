import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Chin traits of an {@link IAutoMovieFace}'s jaw: signed morph weights in `[-2,
 * 2]`, `0`/omitted meaning the template's chin unchanged. The leaves project
 * onto the unsided `chinLength` and `chinProtrusion` morph targets.
 *
 * @evidence contracts/common.md#principled-implementation Two optional leaves that `flattenFace` projects onto the single targets `chinLength` and `chinProtrusion`, reporting any range violation at `jaw.chin.length` or `jaw.chin.protrusion`.
 * @evidence contracts/common.md#clear-and-simple-design Nested under the jaw because the chin is the front of the same mandible, and kept as its own interface so the jaw record holds one width and one sub-group.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The chin is a midline feature with no side rule; each leaf passes through its `SINGLE` table entry unchanged, with no derived or combined value.
 * @evidence contracts/common.md#meaningful-documentation Gives the range, the unchanged meaning of omission, the target names, and the direction of positive and negative reach and protrusion.
 * @author Samchon
 */
export interface IAutoMovieFaceChin {
  /** Vertical reach of the chin tip: `+` a longer chin, `-` a short one. */
  length?: AutoMovieFaceWeight;

  /** Forward projection of the chin: `+` protrudes, `-` recedes. */
  protrusion?: AutoMovieFaceWeight;
}

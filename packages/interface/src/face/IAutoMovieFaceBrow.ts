import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Traits of ONE eyebrow: signed morph weights in `[-2, 2]`, `0`/omitted meaning
 * unchanged. Lives under {@link IAutoMovieFaceBrowSet.left} / `right`; when it
 * is the only side defined, it applies to BOTH brows. `height` projects onto
 * the `browHeightR` / `browHeightL` morph targets.
 *
 * @evidence contracts/common.md#principled-implementation One optional leaf, `height`, which `flattenFace` reads into `browHeightR` and `browHeightL`; a brow defined on one side only sources both targets, and each weight is applied as a linear template delta.
 * @evidence contracts/common.md#clear-and-simple-design A per-side record so `IAutoMovieFaceBrowSet` owns side resolution and this type owns only what one brow can change, which is its vertical position.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mirroring a lone brow is the generic side rule applied by the brows row of the `PAIRED` table, with no code specific to brows in validation or morphing.
 * @evidence contracts/common.md#meaningful-documentation Gives the range, that omission leaves the brow unchanged, where the record lives, the lone-side rule, the target names, and the direction of positive and negative height.
 * @author Samchon
 */
export interface IAutoMovieFaceBrow {
  /**
   * Vertical position of the brow: `+` raises it off the eye (open, surprised),
   * `-` settles it low and heavy.
   */
  height?: AutoMovieFaceWeight;
}

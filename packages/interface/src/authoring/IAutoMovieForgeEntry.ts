import { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * One cast node and the generated rig that embodies it.
 *
 * @evidence contracts/common.md#principled-implementation `forgeCast` requires `node` to be a cast member with `modelRef: null` forged once, `model.id` to equal `node`, `model.origin` to be `generated`, `model.skeleton` to be non-null, and `validateModel` to accept the model.
 * @evidence contracts/common.md#clear-and-simple-design Pairs the join key with the model instead of relying on `model.id` alone, so a mismatch between the cast slot and the model identity is reported at this entry's own path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The id equality is the documented join for the staged scene's `modelRef ?? node` fallback, not an exception for one asset; `validateModel` violations are re-rooted from `$input` onto the entry path.
 * @evidence contracts/common.md#meaningful-documentation States the id join and the generated-origin and skeleton requirements that `forgeCast` enforces besides model validation.
 * @author Samchon
 */
export interface IAutoMovieForgeEntry {
  /** Script cast node; the model id must equal this join key. */
  node: string;

  /**
   * Generated model (`origin: "generated"`) with a non-null skeleton whose
   * parts, materials and skeleton pass engine model validation.
   */
  model: IAutoMovieModel;
}

import { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * One cast node and the generated rig that embodies it.
 *
 * The model's id is the join key the staged scene resolves a cast member without a modelRef through, so it must equal the node.
 *
 * @evidence contracts/common.md#principled-implementation `forgeCast` requires `node` to name a cast member whose `modelRef` is `null`, `model.id` to equal `node`, `model.origin` to be `"generated"`, a non-null skeleton, and a clean `validateModel` result, whose violations it re-roots under this entry's path.
 * @evidence contracts/common.md#clear-and-simple-design The entry pairs a join key with a whole model record, so model validation stays with `validateModel` and the forge adds only the casting rules and the performer's skeleton requirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A boneless model is refused rather than accepted as a prop, and a mismatched id is refused rather than renamed to the node.
 * @evidence contracts/common.md#meaningful-documentation States the join between node and model id and why it exists, which cast members may be forged, and every requirement the model must meet.
 */
export interface IAutoMovieForgeEntry {
  /**
   * Script cast node whose modelRef is null; the model id must equal this join key.
   */
  node: string;

  /**
   * Generated model (origin: "generated") with a non-null skeleton whose parts, materials and skeleton pass engine model validation.
   */
  model: IAutoMovieModel;
}

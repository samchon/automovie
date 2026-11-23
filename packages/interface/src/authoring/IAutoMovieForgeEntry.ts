import type { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * One cast node and the generated rig that embodies it.
 *
 * The model's id is the join key the staged scene resolves a cast member
 * without a modelRef through, so it must equal the node.
 */
export interface IAutoMovieForgeEntry {
  /**
   * Script cast node whose modelRef is null; the model id must equal this join
   * key.
   */
  node: string;

  /**
   * Generated model (origin: "generated") with a non-null skeleton whose parts,
   * materials and skeleton pass engine model validation.
   */
  model: IAutoMovieModel;
}

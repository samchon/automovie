import { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * One cast node and the generated rig that embodies it.
 *
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

import { IAutoMovieModel } from "../model/IAutoMovieModel";

/** One cast node and the generated rig that embodies it. */
export interface IAutoMovieForgeEntry {
  /** Script cast node; the model id must equal this join key. */
  node: string;

  /** Generated model whose skeleton and geometry pass engine validation. */
  model: IAutoMovieModel;
}

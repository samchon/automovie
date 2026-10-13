import {
  IAutoMovieModelRecipe,
  IAutoMovieSceneNode,
  IAutoMovieVector3,
} from "@automovie/interface";

/** One generated visible wall/building block and its support footprint. */
export interface IAutoMovieWorldBlock {
  /** Stable block identity. */
  id: string;
  /** Block semantic. */
  kind: "wall" | "building";
  /** Primitive recipe registered with production design. */
  recipe: IAutoMovieModelRecipe;
  /** Static scene node using the builder-owned runtime model id. */
  node: IAutoMovieSceneNode;
  /** Exact axis-aligned occupied world volume. */
  bounds: {
    min: IAutoMovieVector3;
    max: IAutoMovieVector3;
  };
}

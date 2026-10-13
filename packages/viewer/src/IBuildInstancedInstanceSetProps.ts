import type {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieModel,
} from "@automovie/interface";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";

/**
 * A compiled instance set and its prototype sources. Source objects remain
 * caller-owned; construction flattens rigid representations before making
 * the viewer's own chunk meshes, materials and per-frame accounting state.
 *
 * @author Samchon
 */
export interface IBuildInstancedInstanceSetProps {
  /**
   * Compact set whose chunks, variation and prototype LOD definitions are read.
   */
  instanceSet: IAutoMovieCompiledInstanceSet;

  /**
   * Compiled runtime models keyed by identity; a missing referenced LOD model
   * refuses before that prototype's representation is built.
   */
  models: ReadonlyMap<string, IAutoMovieModel>;

  /**
   * Already-loaded prototype objects keyed by runtime model id. Omission or a
   * missing entry builds that model's recipe instead. Objects are borrowed,
   * and flattening refuses unsupported skin, morph or multi-material meshes.
   */
  prototypeObjects?: ReadonlyMap<string, IAutoMovieModelObject>;
}

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
 * @evidence contracts/common.md#principled-implementation Supplies compiled compact placements/LOD and model-id registries; sources must describe rigid single-material representations because flattening rejects skin/morph/multi-material input rather than silently changing their deformation.
 * @evidence contracts/common.md#clear-and-simple-design Keeps optional loaded prototypes beside portable models so the builder can borrow a loaded object or construct a missing representation without a second scene registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing prototype entries use the declared model, not fixture-specific fallbacks; referenced missing models and unsupported representations are refused by the builder.
 * @evidence contracts/common.md#meaningful-documentation Documents source ownership, model/prototype lookup keys, portable-model fallback and the supported rigid representation boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input record performs no prototype flattening or population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no construction or update request; its builder owns identity-based representation reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input maps borrow sources; owning runtime construction/disposal determines retained chunk resource lifetimes.
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
   * missing entry builds that portable model instead. Objects are borrowed,
   * and flattening refuses unsupported skin, morph or multi-material meshes.
   */
  prototypeObjects?: ReadonlyMap<string, IAutoMovieModelObject>;
}

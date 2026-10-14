import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";

/**
 * One built environment indexed for a single drawing, schedule or feature
 * derivation.
 *
 * Produced by `indexAutoMovieDrawingDesign` and owned by the derivation that
 * built it. The index reads the environment as it was when indexed, so a
 * caller that edits the environment builds a new one rather than reusing it.
 *
 * @evidence contracts/common.md#principled-implementation Id maps over the design's unique ids, staging from `builtEnvironmentWorldMatrices`, and a tessellation memo keyed by part identity, each valid because the index serves one derivation over an environment that does not change during it.
 * @evidence contracts/common.md#clear-and-simple-design Exactly the lookups the drawing, schedule and feature derivations share, as one record passed to every helper instead of each helper scanning the environment itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element, model or boundary is special-cased; a builder-owned model is absent from `models` by definition rather than stubbed.
 * @evidence contracts/common.md#meaningful-documentation The comment states the producer, the ownership and lifetime, what each member holds, what an absent model means, the staging used, the memo's scope, its failure and the shared-array rule.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record type with no algorithm of its own; `indexAutoMovieDrawingDesign` states the cost of building it.
 * @evidence contracts/performance.md#reuse-equivalent-work `partTriangles` shares each part's tessellation across every element, opening fill and feature of one derivation, keyed by part identity; a new derivation builds a new index, so an edited environment never reads a stale entry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The derivation that builds the index owns it and drops it when it returns; it holds three id maps, one matrix per element and at most one triangle list per tessellated part, all bounded by the design's size.
 * @author Samchon
 */
export interface IAutoMovieDrawingDesignIndex {
  /** Every element by id. */
  elements: ReadonlyMap<string, IAutoMovieBuiltElement>;

  /**
   * Every environment-owned model by id.
   *
   * A builder-owned runtime model is absent, which is how a derivation tells
   * an element whose geometry the design does not carry.
   */
  models: ReadonlyMap<string, IAutoMovieModel>;

  /** Every boundary by id. */
  boundaries: ReadonlyMap<string, IAutoMovieBuiltBoundary>;

  /**
   * Column-major world matrix of every element, keyed by element id.
   *
   * Each element stands in its current operating state, the staging
   * `lowerBuiltEnvironment` gives the scene, so a drawn line and the set piece
   * it depicts stand in the same place.
   */
  matrices: ReadonlyMap<string, number[]>;

  /**
   * Triangles of one model part in model-frame metres.
   *
   * Memoized per part object for the index's lifetime, so a model placed many
   * times is tessellated once. Throws as `autoMovieDrawingPartTriangles` does
   * for a malformed mesh. The returned array is shared between calls and must
   * not be mutated.
   *
   * @evidence contracts/common.md#principled-implementation Memoizes `autoMovieDrawingPartTriangles` by part object identity, which is sound because a part's tessellation depends only on that part and its model, and the indexed environment does not change during the derivation.
   * @evidence contracts/common.md#clear-and-simple-design A member function rather than a separate cache object, so every helper that receives the index reaches the one memo without a second argument.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither part nor model is special-cased; a malformed mesh still throws on first request, and a failed tessellation is not cached as an empty list.
   * @evidence contracts/common.md#meaningful-documentation The comment states the frame and unit, the memo's key and lifetime, the failure behaviour and that the shared array must not be mutated.
   * @evidence contracts/performance.md#efficient-algorithms The first request for a part costs one tessellation, linear in its vertex and index counts, and every later request is one map lookup.
   * @evidence contracts/performance.md#reuse-equivalent-work Two requests are equivalent exactly when they name the same part object of one index, so a model placed on many elements, filling many openings or pinned by many notes is tessellated once per derivation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each tessellated part keeps one triangle list for the index's lifetime, so retention is bounded by the parts of the models the derivation touches and is released with the index.
   */
  partTriangles: (
    model: IAutoMovieModel,
    part: IAutoMovieModelPart,
  ) => readonly IAutoMovieDrawingTriangle[];
}

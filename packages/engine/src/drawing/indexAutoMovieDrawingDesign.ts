import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { builtEnvironmentWorldMatrices } from "../architecture/builtEnvironmentWorldMatrices";
import { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieDrawingPartTriangles } from "./autoMovieDrawingPartTriangles";

/**
 * Index one validated built environment for a drawing derivation.
 *
 * Builds the id lookups every derivation needs, stages every element with
 * `builtEnvironmentWorldMatrices` in its current operating state, and wraps
 * part tessellation in a per-index memo. A derivation builds one index and
 * passes it to every helper, so no lookup scans the environment twice and no
 * part is tessellated twice.
 *
 * The environment must be valid: parents must resolve and be acyclic, as
 * `validateBuiltEnvironment` enforces, or staging throws.
 *
 * @param environment Validated design to index.
 * @returns The index, owned by the caller for one derivation.
 *
 * @evidence contracts/common.md#principled-implementation Hash maps keyed by the design's unique ids, world matrices from the architecture owner that `lowerBuiltEnvironment` and every element-measuring query share, and memoization keyed by part object identity, which is sound because the index serves one derivation over an environment nobody edits meanwhile.
 * @evidence contracts/common.md#clear-and-simple-design One index replaces the per-call linear lookups and repeated tessellations that the drawing, the schedule and feature resolution each performed, and it owns no derivation logic of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element, model or boundary is special-cased; a builder-owned runtime model is simply absent from the model map, which callers report as a gap.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is indexed, which staging the matrices use, the memo and its scope, the validity precondition and its failure, and the ownership of the result.
 * @evidence contracts/performance.md#efficient-algorithms Linear in elements, models and boundaries for the maps plus linear staging of the element hierarchy; tessellation is deferred until a part is first asked for, so models nobody draws cost nothing.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares each part's tessellation across every element placing its model, every opening filled by it and every feature resolved on it within one derivation; equivalence is part object identity in an environment that does not change during the derivation, and a new derivation builds a new index, so nothing stale survives an edit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the index for one derivation; it holds three id maps, one matrix per element and at most one triangle list per tessellated part, bounded by the design's size, and all of it is released with the index when the derivation returns.
 * @author Samchon
 */
export const indexAutoMovieDrawingDesign = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieDrawingDesignIndex => {
  const tessellated: Map<
    IAutoMovieModelPart,
    readonly IAutoMovieDrawingTriangle[]
  > = new Map();
  return {
    elements: new Map(
      environment.elements.map(
        (element: IAutoMovieBuiltElement): [string, IAutoMovieBuiltElement] => [
          element.id,
          element,
        ],
      ),
    ),
    models: new Map(
      environment.models.map(
        (model: IAutoMovieModel): [string, IAutoMovieModel] => [
          model.id,
          model,
        ],
      ),
    ),
    boundaries: new Map(
      environment.boundaries.map(
        (
          boundary: IAutoMovieBuiltBoundary,
        ): [string, IAutoMovieBuiltBoundary] => [boundary.id, boundary],
      ),
    ),
    matrices: builtEnvironmentWorldMatrices(environment),
    partTriangles: (
      model: IAutoMovieModel,
      part: IAutoMovieModelPart,
    ): readonly IAutoMovieDrawingTriangle[] => {
      const cached: readonly IAutoMovieDrawingTriangle[] | undefined =
        tessellated.get(part);
      if (cached !== undefined) return cached;
      const triangles: IAutoMovieDrawingTriangle[] =
        autoMovieDrawingPartTriangles(model, part);
      tessellated.set(part, triangles);
      return triangles;
    },
  };
};

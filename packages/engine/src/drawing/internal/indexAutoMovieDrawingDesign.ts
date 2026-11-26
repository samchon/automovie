import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  type IAutoMovieDrawingDesignIndex,
  type IAutoMovieDrawingTriangle,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { builtEnvironmentWorldMatrices } from "../../architecture/internal/builtEnvironmentWorldMatrices";
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

import { AutoMovieEngineGeometry } from "@automovie/engine";
import {
  type IAutoMovieBicubicAtlasGeometry,
  type IAutoMovieModel,
  type IAutoMovieRealizeBicubicAtlas64,
  type IAutoMovieRecoveryAtlasCompilation,
} from "@automovie/interface";

/*
 * Compile one public coefficient authority into its recipe and generated-mesh
 * models. Domain completeness and analytic approximation acceptance remain
 * distinct; finite coarse cells retain their measured field-error estimates and
 * UV ranges.
 */
export function compileRecoveryAtlas(
  geometry: IAutoMovieBicubicAtlasGeometry,
): IAutoMovieRecoveryAtlasCompilation {
  const generated: IAutoMovieRealizeBicubicAtlas64.IResult =
    AutoMovieEngineGeometry.realizeBicubicAtlas64(geometry);
  const base: IAutoMovieModel = {
    id: "recovery.atlas",
    name: null,
    origin: "generated",
    parts: [],
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  };
  return {
    recipeModel: {
      ...base,
      parts: [
        {
          id: "recovery.atlas.field",
          name: null,
          geometry,
          material: null,
          attachedBone: null,
          transform: null,
        },
      ],
    },
    compiledModel: {
      ...base,
      parts: generated.mesh.indices!.length
        ? [
            {
              id: "recovery.atlas.field",
              name: null,
              geometry: { type: "mesh", mesh: generated.mesh },
              material: null,
              attachedBone: null,
              transform: null,
            },
          ]
        : [],
    },
    realization: {
      complete: generated.complete,
      approximationQualified: generated.approximationQualified,
      diagnostics: generated.diagnostics,
      counts: generated.counts,
    },
    primitiveRanges: generated.primitiveRanges,
  };
}

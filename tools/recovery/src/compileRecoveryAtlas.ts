import { realizeAutoMovieBicubicAtlas64 } from "../../../packages/engine/src/geometry/realizeAutoMovieBicubicAtlas64.ts";
import type { IAutoMovieBicubicAtlasGeometry } from "../../../packages/interface/src/model/IAutoMovieBicubicAtlasGeometry.ts";
import type { IAutoMovieModel } from "../../../packages/interface/src/model/IAutoMovieModel.ts";

/**
 * Compile one public coefficient authority into its recipe and generated-mesh models.
 * Domain completeness and analytic approximation acceptance remain distinct;
 * finite coarse cells retain their measured field-error estimates and UV ranges.
 *
 * @evidence contracts/common.md#principled-implementation The canonical engine atlas realizer computes all positions, normals and indices from the public Bernstein recipe; generated triangles are transferred unchanged to the compiled model.
 * @evidence contracts/common.md#clear-and-simple-design One callable seam serves CLI publication and mathematical validation, preserving one recipe authority and one actual generation result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original source data, external mesh, positional repair or geometry fallback enters either model; diagnostics remain independent of retained finite output.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes declarative recipe from independently generated mesh and identifies ownership of geometry and primitive ranges.
 * @evidence contracts/performance.md#efficient-algorithms Model assembly transfers the single engine result without copying its arrays; adaptive numerical cost belongs to the realizer.
 * @evidence contracts/performance.md#reuse-equivalent-work Both models and all qualification records reuse the same recipe and one engine invocation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Recipe coefficients remain caller-owned and generated arrays transfer to the compiled model; no source mesh, process, global cache or file handle is acquired.
 */
export function compileRecoveryAtlas(
  geometry: IAutoMovieBicubicAtlasGeometry,
): {
  recipeModel: IAutoMovieModel;
  compiledModel: IAutoMovieModel;
  realization: {
    complete: boolean;
    approximationQualified: boolean;
    diagnostics: string[];
    counts: ReturnType<typeof realizeAutoMovieBicubicAtlas64>["counts"];
  };
  primitiveRanges: ReturnType<
    typeof realizeAutoMovieBicubicAtlas64
  >["primitiveRanges"];
} {
  const generated: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(geometry);
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

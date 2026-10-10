import type { IAutoMovieModel } from "@automovie/interface";

/** Actual material classification shared by the AO bake and its cache.
 * Masked and blended finishes do not occlude this opaque-surface estimate.
 *
 * @author Samchon
 */
export function humanFaceOcclusionOpaqueMaterials(
  model: IAutoMovieModel,
): Set<string> {
  return new Set(
    model.materials
      .filter(
        (material) =>
          material.alphaMode !== "mask" && material.alphaMode !== "blend",
      )
      .map((material) => material.id),
  );
}

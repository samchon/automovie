import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { AutoMovieTextureBinding, IAutoMovieMaterial } from "@automovie/interface";

/**
 * Every distinct texture asset one material binds, ascending.
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Enumerates the bound texture assets whose decoded memory must be measured.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Closes material texture dependencies before dimensions and memory gaps are reported.
 */
export const texturesOf = (material: IAutoMovieMaterial): string[] => {
  const assets = new Set<string>();
  const bind = (binding: AutoMovieTextureBinding | null | undefined): void => {
    if (binding === null || binding === undefined) return;
    assets.add(typeof binding === "string" ? binding : binding.asset);
  };
  bind(material.baseColorTexture);
  bind(material.metallicRoughnessTexture);
  bind(material.normalTexture);
  bind(material.occlusionTexture);
  bind(material.emissiveTexture);
  return [...assets].sort(compareAutoMovieRenderIds);
};

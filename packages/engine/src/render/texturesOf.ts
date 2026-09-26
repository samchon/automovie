import { IAutoMovieMaterial } from "@automovie/interface";

import { materialTextureSlots } from "../validation/materialTextureSlots";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/**
 * Every distinct texture asset one material binds, ascending.
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Enumerates the bound texture assets whose decoded memory must be measured.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Closes material texture dependencies before dimensions and memory gaps are reported.
 */
export const texturesOf = (material: IAutoMovieMaterial): string[] => {
  const assets = new Set<string>();
  for (const { binding } of materialTextureSlots(material))
    assets.add(typeof binding === "string" ? binding : binding.asset);
  return [...assets].sort(compareAutoMovieRenderIds);
};

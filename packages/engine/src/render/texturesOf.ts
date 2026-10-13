import { IAutoMovieMaterial } from "@automovie/interface";

import { materialTextureSlots } from "../validation/materialTextureSlots";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/** Every distinct texture asset one material binds, ascending. */
export const texturesOf = (material: IAutoMovieMaterial): string[] => {
  const assets = new Set<string>();
  for (const { binding } of materialTextureSlots(material))
    assets.add(typeof binding === "string" ? binding : binding.asset);
  return [...assets].sort(compareAutoMovieRenderIds);
};

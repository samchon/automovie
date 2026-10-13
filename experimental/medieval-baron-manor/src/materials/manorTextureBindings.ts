import type { IAutoMovieTextureReference } from "@automovie/interface";
import { textureTiles } from "./textureTiles";
import { textureBinding } from "./textureBinding";

/** Returns the bindings for all seven authored tile families so the host can prime its texture cache. */
export const manorTextureBindings: () => IAutoMovieTextureReference[]=(): IAutoMovieTextureReference[] =>Object.keys(textureTiles).map(textureBinding);

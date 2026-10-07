import type { IAutoMovieTextureClosureInput } from "@automovie/engine";

/** Existing texture scenario overrides; the original production identity remains fixed. */
export interface ITextureAssetClosureOverrides extends Partial<Omit<IAutoMovieTextureClosureInput, "production">> {}

import type { IAutoMovieTextureClosureInput } from "@automovie/interface";

/** Existing texture scenario overrides; the original production identity remains fixed. */
export interface ITextureAssetClosureOverrides extends Partial<
  Omit<IAutoMovieTextureClosureInput, "production">
> {}

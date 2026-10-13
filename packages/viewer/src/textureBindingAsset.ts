import { AutoMovieTextureBinding } from "@automovie/interface";

/** The asset id a legacy or structured binding names. */
export const textureBindingAsset = (
  binding: AutoMovieTextureBinding,
): string => (typeof binding === "string" ? binding : binding.asset);

import { AutoMovieTextureBinding } from "@automovie/interface";

/**
 * Read the asset id from an admitted legacy string or structured texture
 * binding. Sampling configuration belongs to the resolver and cache rather than
 * this selector.
 */
export function textureBindingAsset(binding: AutoMovieTextureBinding): string {
  return typeof binding === "string" ? binding : binding.asset;
}

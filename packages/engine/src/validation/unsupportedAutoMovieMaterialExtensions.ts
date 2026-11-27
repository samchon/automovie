import { AutoMovieEngineText } from "../text/AutoMovieEngineText";
import { AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS } from "./constants/AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS";
import { isAutoMovieMaterialExtension } from "./internal/isAutoMovieMaterialExtension";

/**
 * Select material/texture-category names absent from
 * AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS, deduplicate and sort by code
 * units.
 */
export function unsupportedAutoMovieMaterialExtensions(
  extensions: readonly string[],
): string[] {
  return [
    ...new Set(
      extensions.filter(
        (name: string): boolean =>
          isAutoMovieMaterialExtension(name) &&
          !AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS.has(name),
      ),
    ),
  ].sort(AutoMovieEngineText.compareCodeUnits);
}

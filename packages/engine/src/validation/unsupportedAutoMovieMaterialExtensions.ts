import { compareCodeUnits } from "../text/compareCodeUnits";
import { AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS } from "./constants/AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS";
import { isAutoMovieMaterialExtension } from "./isAutoMovieMaterialExtension";

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
  ].sort(compareCodeUnits);
}

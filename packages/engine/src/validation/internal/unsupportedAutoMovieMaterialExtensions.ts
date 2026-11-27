import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { AutoMovieEngineSupportedMaterialExtensions } from "../AutoMovieEngineSupportedMaterialExtensions";
import { isAutoMovieMaterialExtension } from "./isAutoMovieMaterialExtension";

/*
 * Select material/texture-category names absent from
 * AutoMovieEngineSupportedMaterialExtensions, deduplicate and sort by code
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
          !AutoMovieEngineSupportedMaterialExtensions.has(name),
      ),
    ),
  ].sort(AutoMovieEngineText.compareCodeUnits);
}

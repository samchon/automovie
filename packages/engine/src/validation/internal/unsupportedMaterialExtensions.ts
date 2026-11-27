import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { AutoMovieEngineSupportedMaterialExtensions } from "../AutoMovieEngineSupportedMaterialExtensions";
import { isMaterialExtension } from "./isMaterialExtension";

/*
 * Select material/texture-category names absent from
 * AutoMovieEngineSupportedMaterialExtensions, deduplicate and sort by code
 * units.
 */
export function unsupportedMaterialExtensions(
  extensions: readonly string[],
): string[] {
  return [
    ...new Set(
      extensions.filter(
        (name: string): boolean =>
          isMaterialExtension(name) &&
          !AutoMovieEngineSupportedMaterialExtensions.has(name),
      ),
    ),
  ].sort(AutoMovieEngineText.compareCodeUnits);
}

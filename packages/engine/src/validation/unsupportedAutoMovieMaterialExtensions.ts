import { compareCodeUnits } from "../text/compareCodeUnits";
import { AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS } from "./constants/AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS";
import { isAutoMovieMaterialExtension } from "./isAutoMovieMaterialExtension";

/**
 * Every material or texture extension an imported asset declares that automovie
 * cannot restate, in code-unit order.
 *
 * Returned as data rather than pushed as a violation because the honest
 * category is a REPORT, not a refusal: the asset still renders, and refusing a
 * licensed model for carrying a sheen lobe would be the engine deciding what
 * art a production may buy. The caller (the production builder) turns this
 * into a warning diagnostic that names each one.
 */
export const unsupportedAutoMovieMaterialExtensions = (
  extensions: readonly string[],
): string[] =>
  [
    ...new Set(
      extensions.filter(
        (name) =>
          isAutoMovieMaterialExtension(name) &&
          !AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS.has(name),
      ),
    ),
  ].sort(compareCodeUnits);

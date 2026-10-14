import { compareCodeUnits } from "../text/compareCodeUnits";
import { AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS } from "./constants/AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS";
import { isAutoMovieMaterialExtension } from "./isAutoMovieMaterialExtension";

/**
 * Select material/texture-category names absent from AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS, deduplicate and sort by code units.
 *
 * @evidence contracts/common.md#principled-implementation Select material/texture-category names absent from AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS, deduplicate and sort by code units.
 * @evidence contracts/common.md#clear-and-simple-design The category predicate and supported-name catalog own separate decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Warning inventory does not certify rendering: unsupported required encodings may still prevent loading.
 * @evidence contracts/common.md#meaningful-documentation The result lists unsupported declared names, leaving host warning severity and loader behavior to callers.
 * @evidence contracts/performance.md#efficient-algorithms E names and S text cost classification work plus O(U log U) distinct-name comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated names share one set entry; the canonical supported catalog is reused across assets.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only distinct string references return; no loaded asset, decoder or host task is retained.
 */
export const unsupportedAutoMovieMaterialExtensions: (extensions: readonly string[]) => string[] = (
  extensions: readonly string[],
): string[] =>
  [
    ...new Set(
      extensions.filter(
        (name: string): boolean =>
          isAutoMovieMaterialExtension(name) &&
          !AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS.has(name),
      ),
    ),
  ].sort(compareCodeUnits);

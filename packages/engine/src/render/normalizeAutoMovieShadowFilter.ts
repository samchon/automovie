import type { IAutoMovieSceneEnvironment } from "@automovie/interface";

/**
 * Resolve the legacy soft-PCF spelling to the supported PCF filter. The WebGL
 * profile removed a distinct soft-PCF implementation; preserving the authored
 * spelling must not manufacture a separate renderer or evidence identity.
 *
 * @evidence contracts/common.md#principled-implementation Normalize authored pcfSoft to the supported PCF identity while preserving PCF/VSM; unknown runtime filter values throw rather than creating an unsupported renderer policy.
 * @evidence contracts/common.md#clear-and-simple-design One compatibility owner is shared by target sealing and shadow allocation/submission resolution, so policy identity cannot diverge between them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The soft-PCF alias follows the supported WebGL profile, not a fixture exception; no alias changes point-light VSM refusal or fabricates a separate allocation.
 * @evidence contracts/common.md#meaningful-documentation Docs identify the legacy spelling, canonical result union and unsupported-value failure.
 * @evidence contracts/performance.md#efficient-algorithms A fixed discriminant switch takes O(1) work and returns one scalar with no collection allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Target and shadow owners reuse the same filter normalization; immutable enum input requires no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the normalized string/error escapes, with no graphics policy object, map or resource handle retained.
 */
export function normalizeAutoMovieShadowFilter(
  type: IAutoMovieSceneEnvironment["shadows"]["type"],
): "pcf" | "vsm" {
  switch (type) {
    case "pcf":
    case "pcfSoft": return "pcf";
    case "vsm": return "vsm";
    default: throw new Error("Unsupported shadow filter: " + String(type));
  }
}

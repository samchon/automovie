import type { AutoMovieHumanFaceOpticalSurface } from "./AutoMovieHumanFaceOpticalSurface";

/**
 * Stable generated identity shared by optical emission and asset readers.
 * The person assembly supplies its existing face prefix at its own boundary.
 * This vocabulary identifies generated surfaces, not a guessed source asset.
 *
 * @evidence contracts/common.md#principled-implementation Side and semantic optical role name one stable generated surface identity.
 * @evidence contracts/common.md#clear-and-simple-design Emission and readers share one identity vocabulary while the person owner applies its face prefix.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The key names generated roles rather than guessing source assets or anatomy from labels.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies prefix responsibility and generated identity scope.
 * @evidence contracts/performance.md#efficient-algorithms Two small supported strings and fixed separators require constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work All optical consumers share the same spelling; no stateful identity registry is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned string survives, with no retained geometry or task.
 */
export function humanFaceOpticalPartId(
  side: "left" | "right",
  surface: AutoMovieHumanFaceOpticalSurface,
): string {
  return "optics:" + side + ":" + surface;
}

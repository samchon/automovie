import type { AutoMovieHumanFaceOpticalSurface } from "./AutoMovieHumanFaceOpticalSurface";

/**
 * Stable generated identity shared by optical emission and asset readers.
 * The person assembly supplies its existing face prefix at its own boundary.
 * This vocabulary identifies generated surfaces, not a guessed source asset.
 */
export function humanFaceOpticalPartId(
  side: "left" | "right",
  surface: AutoMovieHumanFaceOpticalSurface,
): string {
  return "optics:" + side + ":" + surface;
}

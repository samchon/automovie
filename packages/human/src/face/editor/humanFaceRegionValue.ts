import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import type { IAutoMovieHumanFaceRecipe } from "../structures/IAutoMovieHumanFaceRecipe";
import { resolveHumanFaceDocument } from "../document/resolveHumanFaceDocument";
import { assertRegion } from "./assertRegion";
import { humanFaceRegions } from "./humanFaceRegions";

/**
 * Read the actual combined profile, including an explicitly requested side.
 * Missing optional profiles remain absent rather than becoming invented data.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Exposes applied values after traits, details and independent side overrides.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Makes the final interpreted profile inspectable independently of edit history.
 */
export function humanFaceRegionValue<
  K extends (typeof humanFaceRegions)[number],
>(
  document: IAutoMovieHumanFaceDocument,
  region: K,
  side?: "right" | "left",
): IAutoMovieHumanFaceRecipe[K] {
  assertRegion(region, side);
  const face = resolveHumanFaceDocument(document);
  if (
    side !== undefined &&
    (region === "eye" || region === "ear" || region === "cheek")
  )
    return structuredClone(
      face[side][region as "eye" | "ear" | "cheek"],
    ) as IAutoMovieHumanFaceRecipe[K];
  return structuredClone(face.recipe[region]);
}

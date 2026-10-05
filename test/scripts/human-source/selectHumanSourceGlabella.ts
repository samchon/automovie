import { pickHumanSourceExtremum } from "./pickHumanSourceExtremum.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";
import type { IHumanSourceLandmarkPick } from "./structures/IHumanSourceLandmarkPick.ts";

/**
 * Glabella: the most anterior midline point at browridge height. The skin
 * carries no frontal bone, so the browridge height is read from the eyebrow
 * card, which lies on it: the band is the card's neutral vertical extent, and
 * the pick is the largest z among head midline vertices inside it.
 */
export function selectHumanSourceGlabella(generation: IHumanSourceGeneration, midline: readonly number[]): IHumanSourceLandmarkPick {
  const brow = generation.parts.find((part) => part.id === "Human.eyebrow001");
  if (brow === undefined) throw new Error("Head landmark glabella: the generation has no eyebrow card.");
  let low = Infinity;
  let high = -Infinity;
  for (let i = 1; i < brow.surface.positions.length; i += 3) {
    low = Math.min(low, brow.surface.positions[i]);
    high = Math.max(high, brow.surface.positions[i]);
  }
  const p = generation.skin.positions;
  return pickHumanSourceExtremum("glabella", p, midline.filter((v) => p[3 * v + 1] >= low && p[3 * v + 1] <= high), 2, "max");
}

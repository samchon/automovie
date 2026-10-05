import { pickHumanSourceExtremum } from "./pickHumanSourceExtremum.ts";
import type { IHumanSourceLandmarkPick } from "./structures/IHumanSourceLandmarkPick.ts";

/**
 * Pronasale, the nose tip: the most anterior midline point above the mouth
 * (the face's mouth joint). It bounds the nasal bridge sellion is searched on
 * and is not itself declared as a landmark.
 */
export function selectHumanSourcePronasale(positions: readonly number[], midline: readonly number[], mouthHeight: number): IHumanSourceLandmarkPick {
  return pickHumanSourceExtremum("pronasale", positions, midline.filter((v) => positions[3 * v + 1] > mouthHeight), 2, "max");
}

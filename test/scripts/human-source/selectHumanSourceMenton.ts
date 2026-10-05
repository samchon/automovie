import { humanSourceWeightTolerance } from "./humanSourceWeightTolerance.ts";
import { pickHumanSourceExtremum } from "./pickHumanSourceExtremum.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";
import type { IHumanSourceLandmarkPick } from "./structures/IHumanSourceLandmarkPick.ts";

/**
 * Menton: the inferior point of the mandible in the midsagittal plane. The
 * skin's midline profile keeps descending from the chin into the neck, so its
 * lowest point is not the chin. The mandible is read through the face's jaw
 * attachment instead: midline skin that moves entirely with the jaw (weight
 * one within storage) lies on the mandible, and the pick is its lowest point.
 */
export function selectHumanSourceMenton(generation: IHumanSourceGeneration, midline: readonly number[]): IHumanSourceLandmarkPick {
  const jaw = generation.attachments.find((attachment) => attachment.owner === "jaw");
  if (jaw === undefined) throw new Error("Head landmark menton: the generation has no jaw attachment.");
  const weight = new Map<number, number>();
  for (let i = 0; i < jaw.rows.length; i += 2) weight.set(jaw.rows[i], jaw.rows[i + 1]);
  const mandible = midline.filter((v) => (weight.get(v) ?? 0) >= 1 - humanSourceWeightTolerance);
  return pickHumanSourceExtremum("menton", generation.skin.positions, mandible, 1, "min");
}

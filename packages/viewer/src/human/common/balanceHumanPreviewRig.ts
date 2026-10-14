import { HUMAN_PREVIEW_GREY_CARD } from "./HUMAN_PREVIEW_GREY_CARD.js";
import { HUMAN_PREVIEW_MIDDLE_GREY } from "./HUMAN_PREVIEW_MIDDLE_GREY.js";
import { HumanPreviewLight } from "./HumanPreviewLight.js";
import { humanPreviewGreyCard } from "./humanPreviewGreyCard.js";
import { humanPreviewLinearExposure } from "./humanPreviewLinearExposure.js";
import { humanPreviewLuminance } from "./humanPreviewLuminance.js";

/**
 * The rig white balanced and exposed on a grey card turned to `key`, the
 * direction toward the key light: each light's colour times the per-channel
 * gain, and the tone mapping exposure.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates linear grey-card irradiance, takes its weighted luminance, scales each RGB channel by luminance divided by card channel, and chooses exposure for the authored reflectance/target. Finite positive card channels and representable arithmetic are required; the existing check rejects nonpositive channels but does not exclude positive infinity.
 * @evidence contracts/common.md#clear-and-simple-design Numerical channel balancing returns new light records and exposure while native light creation stays in addHumanPreviewRig. Card evaluation and the scalar exposure ratio have their own named owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 0.18 card and L*50 target are declared display calibration conventions, not patient measurements or proof of matching photographs. Directions and relative powers remain authored; no texture or document value is adjusted to force a comparison.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies per-channel gains and exposure returned to the caller; validity requires the admitted authored rig, and this numerical calculation alone proves no observed beauty.
 * @evidence contracts/performance.md#efficient-algorithms One light traversal evaluates the card and one builds balanced records, linear time and storage in light count. Each RGB operation uses three channels rather than processing geometry or image pixels.
 * @evidence contracts/performance.md#reuse-equivalent-work Gain derives from the same card used for exposure, and that one gain is reused for all directional and hemisphere colors. Mutable rig input receives fresh evaluation rather than a subject-name cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns copied RGB tuples/light records and scalars without native lights or tasks. Unchanged direction tuples remain borrowed from the input; callers own the resulting records' lifetime.
 */
export function balanceHumanPreviewRig(
  lights: readonly HumanPreviewLight[],
  key: readonly [number, number, number],
): {
  lights: HumanPreviewLight[];
  gain: [number, number, number];
  exposure: number;
} {
  const card: [number, number, number] = humanPreviewGreyCard(lights, key);
  if (card.some((value: number): boolean => !(value > 0)))
    throw new Error("The key-lit grey card needs light in every channel.");
  const Y: number = humanPreviewLuminance(card);
  const gain: [number, number, number] = card.map(
    (value: number): number => Y / value,
  ) as [number, number, number];
  const scale: (
    rgb: readonly [number, number, number],
  ) => [number, number, number] = (
    rgb: readonly [number, number, number],
  ): [number, number, number] =>
    rgb.map((value: number, c: number): number => value * gain[c]!) as [
      number,
      number,
      number,
    ];
  return {
    lights: lights.map(
      (
        light: HumanPreviewLight,
      ):
        | {
            color: [number, number, number];
            kind: "directional";
            direction: readonly [number, number, number];
            intensity: number;
          }
        | {
            sky: [number, number, number];
            ground: [number, number, number];
            kind: "hemisphere";
            intensity: number;
          } =>
        light.kind === "directional"
          ? { ...light, color: scale(light.color) }
          : { ...light, sky: scale(light.sky), ground: scale(light.ground) },
    ),
    gain,
    exposure: humanPreviewLinearExposure(
      (HUMAN_PREVIEW_GREY_CARD * Y) / Math.PI,
      HUMAN_PREVIEW_MIDDLE_GREY,
    ),
  };
}

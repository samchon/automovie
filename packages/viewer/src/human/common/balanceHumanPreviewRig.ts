import { HumanPreviewLight } from "./HumanPreviewLight.js";

import { humanPreviewGreyCard } from "./humanPreviewGreyCard.js";

import { humanPreviewLuminance } from "./humanPreviewLuminance.js";

import { humanPreviewLinearExposure } from "./humanPreviewLinearExposure.js";

import { HUMAN_PREVIEW_GREY_CARD } from "./HUMAN_PREVIEW_GREY_CARD.js";

import { HUMAN_PREVIEW_MIDDLE_GREY } from "./HUMAN_PREVIEW_MIDDLE_GREY.js";

/**
 * The rig white balanced and exposed on a grey card turned to `key`, the
 * direction toward the key light: each light's colour times the per-channel
 * gain, and the tone mapping exposure.
 */
export function balanceHumanPreviewRig(
  lights: readonly HumanPreviewLight[],
  key: readonly [number, number, number],
): {
  lights: HumanPreviewLight[];
  gain: [number, number, number];
  exposure: number;
} {
  const card = humanPreviewGreyCard(lights, key);
  if (card.some((value) => !(value > 0)))
    throw new Error("The key-lit grey card needs light in every channel.");
  const Y = humanPreviewLuminance(card);
  const gain = card.map((value) => Y / value) as [number, number, number];
  const scale = (rgb: readonly [number, number, number]) =>
    rgb.map((value, c) => value * gain[c]!) as [number, number, number];
  return {
    lights: lights.map((light) =>
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

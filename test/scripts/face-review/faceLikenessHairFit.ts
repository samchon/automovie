import { createPortraitHairTexture, decodePortraitPng } from "@automovie/human";

import { faceLikenessReflectance } from "./faceLikenessIrisFit";

/**
 * Hair finish colour of a published document from its photograph, by the
 * iris and brow fits' reflectance-ratio rule.
 *
 * `fit-face-hair.ts` calls `fitFaceLikenessHairColour` for each subject of a
 * population receipt with the photograph's hair sample (the median CIELAB of
 * the hair segmenter's pixels in the head region, `faceLikenessHairColour`)
 * and cheek sample and the document's own linear skin albedo. Hair and cheek
 * are lit by the same scene, so the per-channel ratio of their linear colours
 * cancels exposure and most of the illuminant colour (Retinex, Land and
 * McCann 1971), and that ratio times the skin albedo is the hair's mean
 * albedo. The finish colour is not that mean: the fibre texture multiplies it
 * by each fibre's own shade (`createPortraitHairTexture`), so the colour is
 * the mean albedo over the texture's mean linear shade (`meanShade`, read
 * from the texture itself, alpha-weighted). A photographed head of greying
 * hair is already the mixture's mean, so the colour carries it whole and no
 * greying proportion is set. A component above one is held at one and the
 * row says so; a photograph without both samples gives no colour.
 *
 * Limits: the median mixes the hair's shaded underside with its highlights as
 * the photograph shows them, and a greyscale photograph yields neutral hair
 * of its luminance ratio (`faceLikenessReflectance`).
 * Pure: returns new values.
 */
export function fitFaceLikenessHairColour(props: {
  hair: readonly [number, number, number] | null;
  cheek: readonly [number, number, number] | null;
  skin: readonly [number, number, number];
  meanShade: number;
}): { color: [number, number, number]; clamped: boolean } | null {
  if (props.hair === null || props.cheek === null) return null;
  if (!(props.meanShade > 0 && props.meanShade <= 1))
    throw new Error("A fibre texture's mean shade lies in (0, 1].");
  const raw = faceLikenessReflectance({
    sample: props.hair,
    cheek: props.cheek,
    skin: props.skin,
  }).map((value) => value / props.meanShade);
  return {
    color: raw.map((value) => Math.min(1, value)) as [number, number, number],
    clamped: raw.some((value) => value > 1),
  };
}

/**
 * The alpha-weighted mean linear shade of a layer's fibre texture, as the
 * renderer decodes it (sRGB), for `fitFaceLikenessHairColour`.
 */
export function faceLikenessHairMeanShade(props: {
  seed: number;
  fibres: number;
  coverage: number;
  shade: number;
}): number {
  const image = decodePortraitPng(
    createPortraitHairTexture(
      props.seed,
      props.fibres,
      props.coverage,
      undefined,
      props.shade,
    ),
  );
  const linear = (byte: number) => {
    const v = byte / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  let sum = 0;
  let weight = 0;
  for (let i = 0; i < image.rgba.length; i += 4) {
    const alpha = image.rgba[i + 3]! / 255;
    sum += alpha * linear(image.rgba[i]!);
    weight += alpha;
  }
  if (weight === 0) throw new Error("The fibre texture draws nothing.");
  return sum / weight;
}

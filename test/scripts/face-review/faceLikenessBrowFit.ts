/**
 * Brow fibre pigment of a published document from its photograph, by the
 * iris fit's reflectance-ratio rule.
 *
 * `fit-face-brows.ts` calls `fitFaceLikenessBrowPigment` for each subject of
 * a population receipt with the photograph's brow sample (the darkest tenth
 * of both brow outlines, hair excluded, `faceLikenessBrowColour`) and cheek
 * sample in CIELAB and the document's own linear skin albedo. Brow and cheek
 * are lit by the same scene, so the per-channel ratio of their linear
 * colours cancels exposure and most of the illuminant colour (Retinex, Land
 * & McCann 1971), and that ratio times the skin albedo is the fibres' albedo
 * in the renderer's units, the `pigment` the fibre rule paints. A component
 * above one is held at one and the row says so; a photograph without both
 * samples gives no pigment.
 *
 * Limits: the darkest tenth still mixes skin into a sparse brow, which reads
 * the brow paler, as the eye does; the brow ridge's shade darkens it a
 * little; a greyscale photograph yields a neutral brow
 * (`faceLikenessReflectance`). Pure: returns new
 * values.
 */
import { faceLikenessReflectance } from "./faceLikenessIrisFit";

/** One subject's fitted brow pigment, or null without both samples. */
export function fitFaceLikenessBrowPigment(props: {
  brow: readonly [number, number, number] | null;
  cheek: readonly [number, number, number] | null;
  skin: readonly [number, number, number];
  /** The colour a greyscale photograph cannot show (`faceLikenessReflectance`). */
  prior?: readonly [number, number, number];
}): { pigment: [number, number, number]; clamped: boolean } | null {
  if (props.brow === null || props.cheek === null) return null;
  const raw = faceLikenessReflectance({
    sample: props.brow,
    cheek: props.cheek,
    skin: props.skin,
    prior: props.prior,
  });
  return {
    pigment: raw.map((value) => Math.min(1, value)) as [number, number, number],
    clamped: raw.some((value) => value > 1),
  };
}

/** One side's brow and cheek samples in CIELAB. */
export interface IFaceLikenessBrowSamples {
  /** The median of the brow outline: the tone as seen. */
  tone: readonly [number, number, number];
  /** The darkest tenth of the outline: the fibres. */
  fibre: readonly [number, number, number];
  cheek: readonly [number, number, number];
}

/**
 * The share of the brow outline its fibres cover, from what the eye sees
 * there: the outline's tone is its fibres and the skin between them mixed
 * in proportion to their coverage, so in luminance over the cheek's (which
 * cancels exposure) `tone = c fibre + (1 - c)`, and `c = (1 - tone) /
 * (1 - fibre)`. Null where the fibres' luminance lies within `contrast` of
 * the skin's (grey or blond brows on pale skin), where the mixture cannot be
 * told apart. Pure.
 */
export function faceLikenessBrowCoverage(
  samples: IFaceLikenessBrowSamples,
  contrast = 0.1,
): number | null {
  const Y = (lab: readonly [number, number, number]) => {
    const fy = (lab[0] + 16) / 116;
    return fy ** 3 > 216 / 24389 ? fy ** 3 : (116 * fy - 16) / (24389 / 27);
  };
  const cheek = Y(samples.cheek);
  if (!(cheek > 0)) return null;
  const tone = Y(samples.tone) / cheek;
  const fibre = Y(samples.fibre) / cheek;
  if (!(Math.abs(1 - fibre) >= contrast)) return null;
  return Math.min(1, Math.max(0, (1 - tone) / (1 - fibre)));
}

/**
 * A brow's fibre density from its photograph and its render at the current
 * density: the density scales the card's coverage, so the one that makes the
 * render's coverage the photograph's is the current density times their
 * ratio, each coverage the mean of the sides that read one
 * (`faceLikenessBrowCoverage`), held to the fibre rule's range [0, 4]. Null
 * where either reads none or the render's is zero. Pure.
 */
export function fitFaceLikenessBrowDensity(props: {
  photograph: readonly IFaceLikenessBrowSamples[];
  render: readonly IFaceLikenessBrowSamples[];
  density: number;
}): { density: number; photograph: number; render: number } | null {
  const mean = (sides: readonly IFaceLikenessBrowSamples[]) => {
    const read = sides
      .map((side) => faceLikenessBrowCoverage(side))
      .filter((value) => value !== null);
    return read.length === 0
      ? null
      : read.reduce((sum, value) => sum + value, 0) / read.length;
  };
  const photograph = mean(props.photograph);
  const render = mean(props.render);
  if (photograph === null || render === null || !(render > 0)) return null;
  return {
    density: Math.min(4, Math.max(0, (props.density * photograph) / render)),
    photograph,
    render,
  };
}

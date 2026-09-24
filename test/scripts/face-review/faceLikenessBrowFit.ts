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

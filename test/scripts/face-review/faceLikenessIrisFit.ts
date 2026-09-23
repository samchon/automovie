/**
 * Iris pigment of a published document from its photograph, by one shared
 * reflectance-ratio rule.
 *
 * `fit-face-iris.ts` calls `fitFaceLikenessIrisPigment` for each subject of
 * a population receipt (`measure-face-likeness.ts`) with the photograph's
 * median iris and cheek CIELAB and the document's own linear skin albedo.
 * The iris and the cheek of one photograph are lit by the same scene, so the
 * per-channel ratio of their linear colours cancels exposure and most of the
 * illuminant colour (the ratio principle behind Retinex, Land & McCann,
 * J Opt Soc Am 1971). That ratio times the document's skin albedo is the
 * iris's mean stroma albedo `m` in the renderer's units.
 *
 * `m` is spread into the portrait eye's pigment bands without new freedom:
 * the mean stroma band fraction of the fibre pattern over uniformly
 * distributed phases is 0.478 (integrated numerically), and the shared
 * portrait palette (`base` 0.009/0.006/0.004, `variation`
 * 0.05/0.031/0.012) then has its limbal base at 0.27, 0.29 and 0.41 of its
 * mean stroma in red, green and blue. The fit keeps one contrast for every
 * channel, the red one, so the band structure adds no per-channel freedom:
 * `base = 0.27 m` and
 * `variation = (m - base) / 0.478`. A subject therefore contributes three
 * numbers per eye, the colour a person would name, never a texture. When
 * `base + variation` would leave the unit range the whole pigment is scaled
 * down to fit and the row says so; a photograph without both samples gives
 * no pigment.
 *
 * Limits: the eye sits in the lids' shadow in the photograph and in the
 * render alike, so the ratio is biased dark on both sides rather than
 * corrected; a greyscale photograph yields a grey iris; specular highlights
 * and lashes are resisted only by the medians. Pure: returns new values.
 */
import type { IPortraitIrisPigment } from "@automovie/human";

/** Limbal base over mean stroma of the shared portrait iris palette. */
export const FACE_LIKENESS_IRIS_BASE_SHARE = 0.27;

/** Mean band fraction of the portrait fibre pattern over uniform phases. */
export const FACE_LIKENESS_IRIS_MEAN_BAND = 0.478;

/** CIE 1976 L*a*b* (D65) to linear sRGB, the inverse of the sampler's conversion. */
export function faceLikenessLabToLinear(
  lab: readonly [number, number, number],
): [number, number, number] {
  const fy = (lab[0] + 16) / 116;
  const fx = fy + lab[1] / 500;
  const fz = fy - lab[2] / 200;
  const inverse = (f: number): number =>
    f ** 3 > 216 / 24389 ? f ** 3 : (116 * f - 16) / (24389 / 27);
  const x = 0.95047 * inverse(fx);
  const y = inverse(fy);
  const z = 1.08883 * inverse(fz);
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ];
}

/** One subject's fitted pigment, or null without both photograph samples. */
export function fitFaceLikenessIrisPigment(props: {
  iris: readonly [number, number, number] | null;
  cheek: readonly [number, number, number] | null;
  skin: readonly [number, number, number];
}): { pigment: IPortraitIrisPigment; mean: number[]; scaled: boolean } | null {
  if (props.iris === null || props.cheek === null) return null;
  const iris = faceLikenessLabToLinear(props.iris);
  const cheek = faceLikenessLabToLinear(props.cheek);
  if (cheek.some((value) => !(value > 0)))
    throw new Error("A cheek sample needs positive linear colour.");
  let mean = [0, 1, 2].map(
    (c) => (Math.max(0, iris[c]!) / cheek[c]!) * props.skin[c]!,
  );
  const top =
    Math.max(...mean) *
    (FACE_LIKENESS_IRIS_BASE_SHARE +
      (1 - FACE_LIKENESS_IRIS_BASE_SHARE) / FACE_LIKENESS_IRIS_MEAN_BAND);
  const scaled = top > 1;
  if (scaled) mean = mean.map((value) => value / top);
  const base = mean.map((value) => FACE_LIKENESS_IRIS_BASE_SHARE * value);
  return {
    pigment: {
      base,
      variation: mean.map(
        (value, c) => (value - base[c]!) / FACE_LIKENESS_IRIS_MEAN_BAND,
      ),
    },
    mean,
    scaled,
  };
}

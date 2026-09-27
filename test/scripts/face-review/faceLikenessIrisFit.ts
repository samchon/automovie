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
 * corrected; a greyscale photograph shows the iris's lightness only, so its
 * hue is the recorded ancestry's (`faceLikenessIrisHue`), or grey without
 * one; specular highlights and lashes are resisted only by the medians.
 * Pure: returns new values.
 */
import type { IPortraitIrisPigment } from "@automovie/human";

import type { IFacePopulationFacts } from "./facePopulationFacts";

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

/**
 * Mean photographed iris colour (CIELAB) of each recorded ancestry, from
 * 1448 young adults photographed under one protocol in Toronto (Edwards M.
 * The genetic architecture of iris colour and surface feature variation in
 * populations of East Asian, European and South Asian ancestry. PhD thesis,
 * University of Toronto 2016, Table 3-2), each group the sample-weighted
 * mean over its regional rows and both camera bodies: European 620
 * participants, East Asian 468. The thesis records no African sample and
 * states that in most populations iris colour is limited to shades of
 * brown, blue and green irises appearing with European and, less often,
 * North African, Middle Eastern, Central and South Asian ancestry; its two
 * brown-eyed samples, East and South Asian, agree in hue (a* 13.0 and 13.7,
 * b* 7.4 and 8.2), so an African iris takes their pooled mean, 828
 * participants. Only the chromaticity is used: the lightness is the
 * photograph's.
 */
export const FACE_LIKENESS_IRIS_HUE = {
  european: [39.864, 2.099, 2.328],
  asian: [23.152, 13.006, 7.443],
  african: [25.116, 13.322, 7.789],
} as const satisfies Record<
  NonNullable<IFacePopulationFacts["ancestry"]>,
  readonly [number, number, number]
>;

/**
 * The iris colour a photograph without chroma cannot show: the recorded
 * ancestry's mean (`FACE_LIKENESS_IRIS_HUE`) as linear RGB, whose
 * chromaticity `faceLikenessReflectance` takes as its prior; none without a
 * recorded ancestry. Pure.
 */
export function faceLikenessIrisHue(
  ancestry: IFacePopulationFacts["ancestry"],
): [number, number, number] | undefined {
  return ancestry === null
    ? undefined
    : faceLikenessLabToLinear(FACE_LIKENESS_IRIS_HUE[ancestry]);
}

/** One subject's fitted pigment, or null without both photograph samples. */
export function fitFaceLikenessIrisPigment(props: {
  iris: readonly [number, number, number] | null;
  cheek: readonly [number, number, number] | null;
  skin: readonly [number, number, number];
  /** The hue a greyscale photograph takes (`faceLikenessIrisHue`). */
  prior?: readonly [number, number, number];
}): { pigment: IPortraitIrisPigment; mean: number[]; scaled: boolean } | null {
  if (props.iris === null || props.cheek === null) return null;
  let mean: number[] = faceLikenessReflectance({
    sample: props.iris,
    cheek: props.cheek,
    skin: props.skin,
    prior: props.prior,
  });
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

/**
 * A photographed surface's linear albedo by the reflectance-ratio rule: the
 * per-channel ratio of its linear colour to the cheek's, times the skin
 * albedo. A photograph without chroma (a greyscale print: its cheek's CIELAB
 * chroma under `achromatic`, 2 units, below a just-noticeable colour
 * difference, where a colour photograph's skin reads 18 to 21, Lu et al.
 * 2026) holds no colour to divide: its channels are the same luminance, so
 * the per-channel ratio would hand the skin's hue to the sample. There the
 * ratio is of luminance (CIE Y), times the skin's luminance, and the albedo
 * takes that luminance with the chromaticity of `prior` when one is given (a
 * surface whose colour the photograph cannot show but anatomy fixes, the
 * lips), neutral otherwise. Pure.
 */
export function faceLikenessReflectance(props: {
  sample: readonly [number, number, number];
  cheek: readonly [number, number, number];
  skin: readonly [number, number, number];
  achromatic?: number;
  prior?: readonly [number, number, number];
}): [number, number, number] {
  const sample = faceLikenessLabToLinear(props.sample);
  const cheek = faceLikenessLabToLinear(props.cheek);
  if (cheek.some((value) => !(value > 0)))
    throw new Error("A cheek sample needs positive linear colour.");
  const chroma = Math.hypot(props.cheek[1], props.cheek[2]);
  if (chroma < (props.achromatic ?? 2)) {
    const Y = (rgb: readonly number[]) =>
      0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
    const value = (Math.max(0, Y(sample)) / Y(cheek)) * Y(props.skin);
    const prior = props.prior;
    if (prior === undefined || !(Y(prior) > 0)) return [value, value, value];
    return prior.map((c) => (c * value) / Y(prior)) as [number, number, number];
  }
  return [0, 1, 2].map(
    (c) => (Math.max(0, sample[c]!) / cheek[c]!) * props.skin[c]!,
  ) as [number, number, number];
}

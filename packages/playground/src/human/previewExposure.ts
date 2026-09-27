/**
 * Photographic exposure and white balance of the preview light rig.
 *
 * A portrait photograph is exposed and white balanced on the light that
 * falls on the subject: an incident meter sets the exposure that renders an
 * 18 percent grey card as middle grey (ISO 2720:1974, the calibration of
 * incident-light meters), and the grey card read under the key light sets the
 * white balance that makes it neutral. The preview does the same with its own
 * rig: `humanPreviewGreyCard` sums the linear irradiance on a Lambertian card
 * turned to the key light (every directional light's colour times its
 * intensity and the cosine of its incidence, and the hemisphere light's mix
 * of ground and sky colour by the card's tilt, as the renderer shades them),
 * and `balanceHumanPreviewRig` scales each light's colour by one von Kries
 * gain per channel (von Kries 1902; the luminance over the card's channel,
 * so the card turns neutral at its own luminance) and solves the tone
 * mapping exposure at which the card's radiance, 0.18 of that irradiance
 * over pi, displays as CIE L* 50 (a relative luminance of 0.1842). The
 * display is linear, radiance times exposure encoded as sRGB, highlights
 * clipped as a camera's: every colour the editor is compared by, a
 * photograph's included, is decoded by the sRGB transfer function and read
 * as proportional to the light it records, and a filmic curve's toe breaks
 * that proportion where it matters, crushing a dark iris or brow 3 to 4
 * stops under the grey card about twice as far as the photograph's own
 * decoding does. The rig's directions, relative powers and
 * colour contrast between key and fill stay as authored; only the
 * photograph's two global settings change. It never touches a face document,
 * its geometry, its textures or an export.
 *
 * Pure: returns new values.
 */

/** One light of the rig: a directional light or the hemisphere light. */
export type HumanPreviewLight =
  | {
      kind: "directional";
      /** Direction toward the light (its position over a target at the origin). */
      direction: readonly [number, number, number];
      /** Linear RGB colour. */
      color: readonly [number, number, number];
      intensity: number;
    }
  | {
      kind: "hemisphere";
      sky: readonly [number, number, number];
      ground: readonly [number, number, number];
      intensity: number;
    };

/** CIE relative luminance of linear sRGB (IEC 61966-2-1 primaries). */
const luminance = (rgb: readonly number[]): number =>
  0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;

const unit = (v: readonly number[]): [number, number, number] => {
  const length = Math.hypot(v[0]!, v[1]!, v[2]!);
  if (!(length > 0)) throw new Error("A light direction needs a length.");
  return [v[0]! / length, v[1]! / length, v[2]! / length];
};

/**
 * Linear RGB irradiance on a Lambertian card whose normal is `normal`, as the
 * renderer shades it: a directional light gives colour times intensity times
 * the clamped cosine, the hemisphere light (up along +y) the mix of ground
 * and sky colour by half the cosine to up plus a half, times its intensity.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under a photographically exposed, white-balanced light rig.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Exposes and white balances the preview on a key-lit grey card without changing the saved anatomical document.
 */
export function humanPreviewGreyCard(
  lights: readonly HumanPreviewLight[],
  normal: readonly [number, number, number],
): [number, number, number] {
  const n = unit(normal);
  const out: [number, number, number] = [0, 0, 0];
  for (const light of lights) {
    for (let c = 0; c < 3; c++) {
      if (light.kind === "directional") {
        const d = unit(light.direction);
        const cosine = Math.max(0, n[0] * d[0] + n[1] * d[1] + n[2] * d[2]);
        out[c] += light.color[c]! * light.intensity * cosine;
      } else {
        const weight = 0.5 * n[1] + 0.5;
        out[c] +=
          (light.ground[c]! + (light.sky[c]! - light.ground[c]!) * weight) *
          light.intensity;
      }
    }
  }
  return out;
}

/**
 * The tone mapping exposure at which a grey of linear radiance `radiance`
 * displays at relative luminance `target` through the linear transform:
 * their ratio.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under a photographically exposed, white-balanced light rig.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Exposes and white balances the preview on a key-lit grey card without changing the saved anatomical document.
 */
export function humanPreviewLinearExposure(
  radiance: number,
  target: number,
): number {
  if (!(radiance > 0) || !(target > 0 && target < 1))
    throw new Error("Exposure needs a positive radiance and a target below 1.");
  return target / radiance;
}

/** Middle grey: CIE L* 50 as relative luminance. */
export const HUMAN_PREVIEW_MIDDLE_GREY = ((50 + 16) / 116) ** 3;

/** Reflectance of the incident-meter calibration card. */
export const HUMAN_PREVIEW_GREY_CARD = 0.18;

/**
 * The rig white balanced and exposed on a grey card turned to `key`, the
 * direction toward the key light: each light's colour times the per-channel
 * gain, and the tone mapping exposure.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under a photographically exposed, white-balanced light rig.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Exposes and white balances the preview on a key-lit grey card without changing the saved anatomical document.
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
  const Y = luminance(card);
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

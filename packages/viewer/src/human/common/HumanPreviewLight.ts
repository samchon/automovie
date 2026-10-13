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

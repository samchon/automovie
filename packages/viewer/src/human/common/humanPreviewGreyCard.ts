import { HumanPreviewLight } from "./HumanPreviewLight.js";

import { humanPreviewUnitVector } from "./humanPreviewUnitVector.js";

/**
 * Linear RGB irradiance on a Lambertian card whose normal is `normal`, as the
 * renderer shades it: a directional light gives colour times intensity times
 * the clamped cosine, the hemisphere light (up along +y) the mix of ground
 * and sky colour by half the cosine to up plus a half, times its intensity.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under a photographically exposed, white-balanced light rig.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Exposes and white balances the preview on a key-lit grey card without changing the saved anatomical document.
 */
export function humanPreviewGreyCard(
  lights: readonly HumanPreviewLight[],
  normal: readonly [number, number, number],
): [number, number, number] {
  const n = humanPreviewUnitVector(normal);
  const out: [number, number, number] = [0, 0, 0];
  for (const light of lights) {
    for (let c = 0; c < 3; c++) {
      if (light.kind === "directional") {
        const d = humanPreviewUnitVector(light.direction);
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

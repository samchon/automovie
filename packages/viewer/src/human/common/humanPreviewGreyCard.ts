import { HumanPreviewLight } from "./HumanPreviewLight.js";

import { humanPreviewUnitVector } from "./humanPreviewUnitVector.js";

/**
 * Linear RGB irradiance on a Lambertian card whose normal is `normal`, as the
 * renderer shades it: a directional light gives colour times intensity times
 * the clamped cosine, the hemisphere light (up along +y) the mix of ground
 * and sky colour by half the cosine to up plus a half, times its intensity.
 *
 * @evidence contracts/common.md#principled-implementation Normalizes admitted finite nonzero normal/directions and sums clamped directional cosine contributions plus +Y hemisphere interpolation. This is the preview's unoccluded linear-light convention, not a shadowed rendered card or full material response.
 * @evidence contracts/common.md#clear-and-simple-design One numerical evaluator supplies the card used by channel balancing; native lights and surface rendering remain outside this calculation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored light colors and intensities are read without fixture compensation. Their finite nonnegative admission is an upstream premise; the helper does not include occlusion, inverse-square attenuation or a second photographic exposure model.
 * @evidence contracts/common.md#meaningful-documentation The comment states linear RGB irradiance, Lambertian cosine and hemisphere axis/mix so readers can distinguish the card estimate from observed pixels.
 * @evidence contracts/performance.md#efficient-algorithms Visits L lights and three RGB channels, linear time and fixed output storage. Direction normalization is currently repeated per channel, small fixed duplication at the authored light count.
 * @evidence contracts/performance.md#reuse-equivalent-work One output tuple accumulates the actual current rig; no persistent result is reused when light direction/color/power or card normal changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows light records and returns one new RGB tuple. Temporary normalized vectors own no native handle and become unreachable after the call.
 */
export function humanPreviewGreyCard(
  lights: readonly HumanPreviewLight[],
  normal: readonly [number, number, number],
): [number, number, number] {
  const n: [number, number, number] = humanPreviewUnitVector(normal);
  const out: [number, number, number] = [0, 0, 0];
  for (const light of lights) {
    for (let c: number = 0; c < 3; c++) {
      if (light.kind === "directional") {
        const d: [number, number, number] = humanPreviewUnitVector(light.direction);
        const cosine: number = Math.max(0, n[0] * d[0] + n[1] * d[1] + n[2] * d[2]);
        out[c] += light.color[c]! * light.intensity * cosine;
      } else {
        const weight: number = 0.5 * n[1] + 0.5;
        out[c] +=
          (light.ground[c]! + (light.sky[c]! - light.ground[c]!) * weight) *
          light.intensity;
      }
    }
  }
  return out;
}

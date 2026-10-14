import { SUBSURFACE_TEXTURE_SIZE } from "./SUBSURFACE_TEXTURE_SIZE.js";
const { cosines: COSINES, blurs: BLURS }: typeof SUBSURFACE_TEXTURE_SIZE = SUBSURFACE_TEXTURE_SIZE;

/**
 * Compute a 32-by-64 diffuse lookup: the zero-blur row is a clamped cosine, and other rows use 720 midpoint samples with five Gaussian wrap images. This conventional approximation is not a measured tissue diffusion profile or an exact infinite-wrap integral.
 *
 * @evidence contracts/common.md#principled-implementation Weighted circular clamped-cosine quadrature samples blur over [0,pi] and cosine over [-1,1]; normalized discrete weights preserve a bounded response, with finite-grid/quadrature/wrap truncation error.
 * @evidence contracts/common.md#clear-and-simple-design A pure numerical producer returns a fresh table; getSubsurfaceTexture alone owns first-use caching and half-float packing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The grid and integration steps are declared sampling conventions, not fixture-fitted values; no source citation is asserted as read, and exact continuous mean or anatomical response is not certified.
 * @evidence contracts/common.md#meaningful-documentation Documents grid axes, zero-blur branch, midpoint/wrap approximation and separation from cached texture lifetime.
 * @evidence contracts/performance.md#efficient-algorithms For B blur rows, C cosine samples, S=720 angular samples and W=5 wraps, work is O(B*C*S*W) and returned storage O(B*C); each finite sum is needed for this selected quadrature.
 * @evidence contracts/performance.md#reuse-equivalent-work Every direct call recomputes fresh rows; material consumers share completed packed data only through getSubsurfaceTexture, so this function itself is not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned numeric arrays survive the call; it acquires no native handle and the texture owner controls any later retained CPU/GPU population.
 */
export function subsurfaceTable(): number[][] {
  const table: number[][] = [];
  const steps: number = 720;
  for (let j: number = 0; j < BLURS; j++) {
    const s: number = (j / (BLURS - 1)) * Math.PI;
    const row: number[] = [];
    for (let i: number = 0; i < COSINES; i++) {
      const theta: number = Math.acos((i / (COSINES - 1)) * 2 - 1);
      if (s === 0) {
        row.push(Math.max(0, Math.cos(theta)));
        continue;
      }
      let sum: number = 0;
      let weight: number = 0;
      for (let k: number = 0; k < steps; k++) {
        const x: number = -Math.PI + ((k + 0.5) / steps) * 2 * Math.PI;
        // the Gaussian wrapped around the circle
        let w: number = 0;
        for (let wrap: number = -2; wrap <= 2; wrap++) {
          const d: number = x + wrap * 2 * Math.PI;
          w += Math.exp(-0.5 * (d / s) ** 2);
        }
        sum += w * Math.max(0, Math.cos(theta + x));
        weight += w;
      }
      row.push(sum / weight);
    }
    table.push(row);
  }
  return table;
}

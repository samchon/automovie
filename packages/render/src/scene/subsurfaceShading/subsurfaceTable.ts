import { SUBSURFACE_TEXTURE_SIZE } from "./SUBSURFACE_TEXTURE_SIZE.js";

const { cosines: COSINES, blurs: BLURS }: typeof SUBSURFACE_TEXTURE_SIZE =
  SUBSURFACE_TEXTURE_SIZE;

/**
 * Compute a 32-by-64 diffuse lookup: the zero-blur row is a clamped cosine, and
 * other rows use 720 midpoint samples with five Gaussian wrap images. This
 * conventional approximation is not a measured tissue diffusion profile or an
 * exact infinite-wrap integral.
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

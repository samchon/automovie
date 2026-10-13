import { SUBSURFACE_TEXTURE_SIZE } from "./SUBSURFACE_TEXTURE_SIZE.js";
const { cosines: COSINES, blurs: BLURS } = SUBSURFACE_TEXTURE_SIZE;

/**
 * The pre-integrated diffuse response of a translucent surface, as a
 * single-channel table: at `u = (cos θ + 1) / 2` and `v = s / π`, the
 * clamped cosine `max(0, cos)` averaged over angles around θ with a
 * Gaussian of standard deviation `s` radians, wrapped around the circle so
 * its mean over θ stays the Lambertian mean, `1 / π`. Light that travels a
 * distance σ under a surface of curvature κ reaches an angle σκ around it,
 * so `s = σκ` (Penner and Borshukov 2011, with a Gaussian standing in for
 * the diffusion profile). The table is built once and shared.
 */
export const subsurfaceTable = (): number[][] => {
  const table: number[][] = [];
  const steps = 720;
  for (let j = 0; j < BLURS; j++) {
    const s = (j / (BLURS - 1)) * Math.PI;
    const row: number[] = [];
    for (let i = 0; i < COSINES; i++) {
      const theta = Math.acos((i / (COSINES - 1)) * 2 - 1);
      if (s === 0) {
        row.push(Math.max(0, Math.cos(theta)));
        continue;
      }
      let sum = 0;
      let weight = 0;
      for (let k = 0; k < steps; k++) {
        const x = -Math.PI + ((k + 0.5) / steps) * 2 * Math.PI;
        // the Gaussian wrapped around the circle
        let w = 0;
        for (let wrap = -2; wrap <= 2; wrap++) {
          const d = x + wrap * 2 * Math.PI;
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
};


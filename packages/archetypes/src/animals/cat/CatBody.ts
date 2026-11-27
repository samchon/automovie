import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { QuadrupedBodyProfile } from "../quadruped/QuadrupedBodyProfile";

/*
 * A coarse adult domestic cat assembled from separate male reference samples.
 *
 * Poradowski et al. 2024 (https://doi.org/10.3390/vetsci11110522), Tables 1–3,
 * provide withers height and proximal limb lengths. Madrigal-Valverde et al.
 * 2025 (https://doi.org/10.3390/ani15152191) report bare mass in Section 2.2
 * and tape landmarks in Section 2.4 and Table 6 for a separate crossbred
 * sample. Section 2.4 defines the snout-to-S3 measure as head plus body: its
 * 55.77 cm and the Cd1–Cd15 tail's 27.38 cm sum to the reported 83.15 cm total.
 * The torso control subtracts the snout-to-C1 head length and an authored neck
 * allowance from snout-to-S3. Circular head width comes from tape circumference
 * and is a shape proxy. Distal bars, stance, pinna plates, soft-tissue radii
 * and the tail carriage are authored.
 * Returns: A fresh independent profile for the common body builder.
 */
export function CatBody(): AutoMovieArchetypeQuadrupedBody.IBody {
  const neck: number = 0.07;
  const head: number = 0.1258;
  const height: number = CatBody.REFERENCE.withers;
  const body: AutoMovieArchetypeQuadrupedBody.IBody = QuadrupedBodyProfile({
    measures: {
      withers: height,
      girth: CatBody.REFERENCE.girth,
      body: 0.5577 - head - neck,
      neck,
      neckRadius: 0.035,
      head,
      headDiameter: 0.2304 / Math.PI,
      tail: 0.2738,
    },
    fore: [0.1039, 0.1007, 0.032, 0.018],
    hind: [0.1127, 0.1165, 0.043, 0.018],
    construction: {
      withersRadius: 0.08,
      pelvisRun: 0.13,
      neckRootDrop: 0.09,
      neckPitch: 32,
      headPitch: 12,
      tailPitch: 20,
      tailRadius: 0.04,
      tailDock: 0.55,
      inset: 0.32,
      forePitch: [-23, 11, -10, 8],
      hindPitch: [38, -38, 13, 8],
      barRadii: [0.072, 0.05, 0.036, 0.047],
    },
    colors: { coat: "#79685c", tail: "#67564b" },
  });
  return {
    ...body,
    head: {
      ...body.head,
      ears: {
        length: 0.04 / height,
        width: 0.029 / height,
        plateThickness: 0.006 / height,
        direction: { x: 0.25, y: 1, z: 0.06 },
      },
    },
  };
}

/*
 * Fixed dimensions for the assembled adult-male prototype.
 */
export namespace CatBody {
  /*
   * Withers height in metres from Poradowski et al. Tape girth in metres and
   * mass in kilograms come from Madrigal-Valverde et al.
   */
  export const REFERENCE: Readonly<{
    withers: number;
    girth: number;
    mass: number;
  }> = { withers: 0.2709, girth: 0.3254, mass: 4.5 };
}

import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedBodyProfile } from "./QuadrupedBodyProfile";

/**
 * A coarse adult domestic cat assembled from separate male reference samples.
 *
 * Poradowski et al. 2024 (https://doi.org/10.3390/vetsci11110522), Tables 1–3,
 * provide withers height and proximal limb lengths. Madrigal-Valverde et al.
 * 2025 (https://doi.org/10.3390/ani15152191) report bare mass in Section 2.2
 * and tape landmarks in Section 2.4 and Table 6 for a separate crossbred
 * sample. Section 2.4 defines the snout-to-S3 measure as head plus body:
 * its 55.77 cm and the Cd1–Cd15 tail's 27.38 cm sum to the reported 83.15 cm
 * total. The torso control subtracts the snout-to-C1 head length and an
 * authored neck allowance from snout-to-S3. Circular head width
 * comes from tape circumference and is a shape proxy. Distal bars, stance,
 * pinna plates, soft-tissue radii and the tail carriage are authored.
 *
 * @returns A fresh independent profile for the common body builder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the distinct source groups and separates literal measurements from authored and derived controls.
 * @evidence contracts/development/implementation.md#principled-implementation Convert the source measures to SI, then use the common construction for the body, connected limbs, head and tail.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Supply the source and authored shape values to the profile mapper and attach the two coarse ear specifications.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The assembled prototype makes no paired-cohort, joint-limit, segment-mass or paw-friction claim.
 * @evidence contracts/development/implementation.md#efficient-algorithms One fixed-size profile calculation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing body and head owners consume the same profile; the cat adds no mesh or alternative skeleton.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned profile owns its records and retains no external handles.
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

/**
 * Fixed dimensions for the assembled adult-male prototype.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The fields carry metres and kilograms, with separate named evidence for the radiographic and external samples.
 * @evidence contracts/development/design.md#principled-representation One fixed vector feeds the common producer and supplies the gait's default query height.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared producer reads only the dimensions it records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Fixed source means are never sampled independently or represented as correlated individual measurements.
 */
export namespace CatBody {
  /**
   * Withers height in metres from Poradowski et al. Tape girth in metres and
   * mass in kilograms come from Madrigal-Valverde et al.
   */
  export const REFERENCE: Readonly<{
    withers: number;
    girth: number;
    mass: number;
  }> = { withers: 0.2709, girth: 0.3254, mass: 4.5 };
}

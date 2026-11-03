/**
 * The leg's three joint centres, placed from the person's inputs at their
 * published definitions before any skin: the hip, the knee and the ankle of
 * the left leg, in the body frame (forward +X, up +Y, left +Z, calibration
 * millimetres). The right leg is the reflection `z -> -z` (rule J6).
 *
 * - Heights: the hip centre at 0.518 S and the knee centre at 0.2865 S, the
 *   ANSUR II joint-centre stature fractions of de Leva's offsets (sexes
 *   averaged, `docs/anatomy/skeleton.md`); the ankle centre at the lateral
 *   malleolus height, which is the `ankleHeight` input's own definition.
 * - Hip, lateral: Hara et al. 2016 (`docs/sources/hara-2016.md`), the hip
 *   centre `Y = 8 + 0.086 LL` outside the midline of the anterior superior
 *   iliac spines and `Z = -9 - 0.078 LL` under them, `LL` the length from the
 *   spine to the medial malleolus. `LL` is read as the vertical distance from
 *   the spine's height to the medial malleolus' (the spines' height follows
 *   from `Z`); the lateral and forward offsets between the two points (about
 *   6 and 50 mm of 880) change the length by 0.15 %, 0.1 mm of `Y`.
 * - Ankle, lateral: the stance, a bind-posture convention measured on the four
 *   references (`docs/anatomy/leg.md`), like the finger posture.
 * - Knee, lateral: on the straight hip-to-ankle line, the mechanical axis of
 *   the lower limb, whose hip-knee-ankle angle is within 0 to 1.5 degrees in
 *   healthy adults. The reference section centroids at the knee height stand
 *   within 3.6 mm of it on f1, f2 and m1 and 8.0 mm on m2; on f1's
 *   bone-normal sections 0.2 mm.
 * - Forward: the hip stands under the trunk's crotch ring (the caller reads
 *   it), the ankle at the foot's stance, and the knee ahead of their chord by
 *   the standing posture's slight knee extension, a convention carried from
 *   the former fitted line (`KNEE_AHEAD`) until the references' sagittal
 *   alignment is measured.
 */
export namespace AutoMovieHumanLegBones {
  /** A point in the body frame. */
  export type Vec3 = [number, number, number];

  /** What the bones are placed from. */
  export interface IInput {
    /** Stature, calibration mm. */
    stature: number;

    /** Calibration millimetres per world millimetre; the published constants below are world millimetres. */
    scale: number;

    /** Lateral malleolus height, calibration mm: the foot's `ankleHeight` input. */
    ankleHeight: number;

    /** Medial over lateral malleolus height (the foot prior's convention, Gray 1918: the medial stands higher). */
    medial: number;

    /** Forward place of the hip centre, calibration mm: under the trunk's crotch ring. */
    hipForward: number;

    /** Forward place of the ankle centre, calibration mm: the foot's stance. */
    ankleForward: number;
  }

  /** The three joint centres of the left leg and the bones' lengths. */
  export interface IBones {
    /** Hip joint centre. */
    hip: Vec3;

    /** Knee joint centre. */
    knee: Vec3;

    /** Ankle joint centre, at the lateral malleolus. */
    ankle: Vec3;

    /** Femur, hip to knee, mm. */
    femur: number;

    /** Tibia, knee to ankle, mm. */
    tibia: number;
  }

  /** Hip joint centre height, share of stature: ANSUR II trochanterion height plus de Leva's 2.8 / 3.2 mm, sexes averaged. */
  export const HIP: number = 0.518;

  /** Knee joint centre height, share of stature: ANSUR II tibiale height plus de Leva's 29.4 / 33.5 mm, sexes averaged. */
  export const KNEE: number = 0.2865;

  /** Hara 2016, lateral: constant of `Y = 8 + 0.086 LL`, world mm. */
  export const HARA_LATERAL: number = 8;

  /** Hara 2016, lateral: slope of `Y` in `LL`. */
  export const HARA_LATERAL_SLOPE: number = 0.086;

  /** Hara 2016, vertical: constant of `Z = -9 - 0.078 LL`, world mm (the hip centre's drop below the spines). */
  export const HARA_DROP: number = 9;

  /** Hara 2016, vertical: slope of the drop in `LL`. */
  export const HARA_DROP_SLOPE: number = 0.078;

  /**
   * Half the distance between the ankle centres, world mm: the median of the
   * references' left ankle section centroids at the lateral malleolus height,
   * 136.35, 136.77, 137.66 and 136.00 mm (f1, f2, m1, m2; each within 1.1 mm
   * of the median of the others). A bind-posture convention, not a body
   * proportion: it does not follow stature or hip breadth in the four.
   */
  export const STANCE: number = 136.6;

  /** The knee centre ahead of the hip-ankle chord, world mm: the former fitted line's value on f1 (16.4 against the chord's 12.4), flagged for measurement. */
  export const KNEE_AHEAD: number = 4;

  /**
   * The left leg's joint centres.
   *
   * @param input Stature, scale, ankle height and the forward places.
   * @returns The centres; the hip is above the knee and the knee above the ankle.
   * @throws {Error} When an input is not positive or the joints are not stacked.
   */
  export function of(input: IInput): IBones {
    if (!(input.stature > 0) || !(input.scale > 0) || !(input.ankleHeight > 0) || !(input.medial > 0))
      throw new Error("A leg needs a positive stature, scale, ankle height and malleolus ratio");

    // Heights from stature, the ankle at its own input.
    const hipY: number = HIP * input.stature;
    const kneeY: number = KNEE * input.stature;
    const ankleY: number = input.ankleHeight;
    if (!(hipY > kneeY) || !(kneeY > ankleY))
      throw new Error("The hip, knee and ankle must stand one above the other");

    // Hara's length from the spines to the medial malleolus: the spines stand
    // `drop` over the hip centre and `drop` itself grows with the length.
    const medialY: number = input.medial * ankleY;
    const length: number = (hipY + HARA_DROP * input.scale - medialY) / (1 - HARA_DROP_SLOPE);
    const hipZ: number = HARA_LATERAL * input.scale + HARA_LATERAL_SLOPE * length;
    const ankleZ: number = STANCE * input.scale;

    // The knee on the straight line from the hip to the ankle at its height.
    const share: number = (hipY - kneeY) / (hipY - ankleY);
    const kneeZ: number = hipZ + share * (ankleZ - hipZ);
    const kneeX: number = input.hipForward + share * (input.ankleForward - input.hipForward) + KNEE_AHEAD * input.scale;
    const hip: Vec3 = [input.hipForward, hipY, hipZ];
    const knee: Vec3 = [kneeX, kneeY, kneeZ];
    const ankle: Vec3 = [input.ankleForward, ankleY, ankleZ];
    return { hip, knee, ankle, femur: distance(hip, knee), tibia: distance(knee, ankle) };
  }
}

/** Euclidean distance. */
function distance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
}

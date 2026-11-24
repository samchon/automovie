import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLegBones,
} from "@automovie/interface";

/**
 * The leg's three joint centres, placed from the person's inputs at their
 * published definitions before any skin: the hip, the knee and the ankle of the
 * left leg, in the body frame (forward +X, up +Y, left +Z, calibration
 * millimetres). The right leg is the reflection `z -> -z` (rule J6).
 *
 * - Heights: the hip centre at 0.518 S and the knee centre at 0.2865 S, the ANSUR
 *   II joint-centre stature fractions of de Leva's offsets (sexes averaged,
 *   `docs/anatomy/skeleton.md`); the ankle centre at the lateral malleolus
 *   height, which is the `ankleHeight` input's own definition.
 * - Hip, lateral: Hara et al. 2016 (`docs/sources/hara-2016.md`), the hip centre
 *   `Y = 8 + 0.086 LL` outside the midline of the anterior superior iliac
 *   spines and `Z = -9 - 0.078 LL` under them, `LL` the length from the spine
 *   to the medial malleolus. `LL` is read as the vertical distance from the
 *   spine's height to the medial malleolus' (the spines' height follows from
 *   `Z`); the lateral and forward offsets between the two points (about 6 and
 *   50 mm of 880) change the length by 0.15 %, 0.1 mm of `Y`.
 * - Ankle, lateral: the preferred heel-centre spacing of McIlroy and Maki (1997)
 *   is a neutral stance convention.
 * - Knee, lateral: on the straight hip-to-ankle line, the mechanical axis of the
 *   lower limb, whose hip-knee-ankle angle is within 0 to 1.5 degrees in
 *   healthy adults.
 * - Forward: the hip stands under the trunk's crotch ring (the caller reads it),
 *   the ankle at the foot's stance, and the knee on their chord: the bones
 *   stand in the Neutral-0 position, whose knee is the extended knee every
 *   flexion is measured from (`docs/sources/dguv-f4030-neutral-zero.md`), so
 *   the femur's and the tibia's mechanical axes are one line in the sagittal
 *   plane as in the frontal one. A standing person's slight flexion or
 *   hyperextension is a pose from that zero, not a bone place.
 */
export namespace AutoMovieHumanLegBones {
  /**
   * Hip joint centre height, share of stature: ANSUR II trochanterion height
   * plus de Leva's 2.8 / 3.2 mm, sexes averaged.
   */
  export const HIP: number = 0.518;

  /**
   * Knee joint centre height, share of stature: ANSUR II tibiale height plus de
   * Leva's 29.4 / 33.5 mm, sexes averaged.
   */
  export const KNEE: number = 0.2865;

  /** Hara 2016, lateral: constant of `Y = 8 + 0.086 LL`, world mm. */
  export const HARA_LATERAL: number = 8;

  /** Hara 2016, lateral: slope of `Y` in `LL`. */
  export const HARA_LATERAL_SLOPE: number = 0.086;

  /**
   * Hara 2016, vertical: constant of `Z = -9 - 0.078 LL`, world mm (the hip
   * centre's drop below the spines).
   */
  export const HARA_DROP: number = 9;

  /** Hara 2016, vertical: slope of the drop in `LL`. */
  export const HARA_DROP_SLOPE: number = 0.078;

  /**
   * Half the quiet-stance heel-centre separation in mm (McIlroy and Maki 1997,
   * PMID 11415674). The model transfers this separation to the ankle centres as
   * a neutral bind convention.
   */
  export const STANCE: number = 170 / 2;

  /**
   * The left leg's joint centres.
   *
   * @param input Stature, scale, ankle height and the forward places.
   * @returns The centres; the hip is above the knee and the knee above the
   *   ankle.
   * @throws {Error} When an input is not positive or the joints are not
   *   stacked.
   */
  export function of(
    input: IAutoMovieHumanLegBones.IInput,
  ): IAutoMovieHumanLegBones.IBones {
    if (
      !(input.stature > 0) ||
      !(input.scale > 0) ||
      !(input.ankleHeight > 0) ||
      !(input.medial > 0)
    )
      throw new Error(
        "A leg needs a positive stature, scale, ankle height and malleolus ratio",
      );

    const ankleY: number = input.ankleHeight;
    const [hipY, kneeY]: [number, number] =
      input.lengths === undefined
        ? [HIP * input.stature, KNEE * input.stature]
        : chooseHeights(input, input.lengths);
    if (!(hipY > kneeY) || !(kneeY > ankleY))
      throw new Error("The hip, knee and ankle must stand one above the other");

    // Hara's length from the spines to the medial malleolus: the spines stand
    // `drop` over the hip centre and `drop` itself grows with the length.
    const medialY: number = input.medial * ankleY;
    const length: number =
      (hipY + HARA_DROP * input.scale - medialY) / (1 - HARA_DROP_SLOPE);
    const hipZ: number =
      HARA_LATERAL * input.scale + HARA_LATERAL_SLOPE * length;
    const ankleZ: number = STANCE * input.scale;

    // The knee on the straight line from the hip to the ankle at its height,
    // in both planes: the extended knee of the Neutral-0 position.
    const share: number = (hipY - kneeY) / (hipY - ankleY);
    const kneeZ: number = hipZ + share * (ankleZ - hipZ);
    const kneeX: number =
      input.hipForward + share * (input.ankleForward - input.hipForward);
    const hip: AutoMovieVector3Tuple = [input.hipForward, hipY, hipZ];
    const knee: AutoMovieVector3Tuple = [kneeX, kneeY, kneeZ];
    const ankle: AutoMovieVector3Tuple = [input.ankleForward, ankleY, ankleZ];
    return {
      hip,
      knee,
      ankle,
      femur: distance(hip, knee),
      tibia: distance(knee, ankle),
    };
  }
}

/** Place a straight neutral leg of the requested lengths above its fixed ankle. */
function chooseHeights(
  input: IAutoMovieHumanLegBones.IInput,
  lengths: NonNullable<IAutoMovieHumanLegBones.IInput["lengths"]>,
): [number, number] {
  const { femur, tibia } = lengths;
  const total: number = femur + tibia;
  if (!(femur > 0 && tibia > 0 && Number.isFinite(total)))
    throw new Error("A leg needs finite positive femur and tibia lengths");

  // Hara's lateral hip coordinate is affine in hip height. Substitute it
  // into the squared hip-to-ankle distance and take the upper intersection.
  const ankleY: number = input.ankleHeight;
  const constant: number =
    AutoMovieHumanLegBones.HARA_LATERAL * input.scale -
    AutoMovieHumanLegBones.STANCE * input.scale;
  const zSlope: number =
    AutoMovieHumanLegBones.HARA_LATERAL_SLOPE /
    (1 - AutoMovieHumanLegBones.HARA_DROP_SLOPE);
  const zAtAnkle: number =
    constant +
    zSlope *
      ((1 - input.medial) * ankleY +
        AutoMovieHumanLegBones.HARA_DROP * input.scale);
  const dx: number = input.hipForward - input.ankleForward;
  const a: number = 1 + zSlope ** 2;
  const halfB: number = zSlope * zAtAnkle;
  const c: number = dx ** 2 + zAtAnkle ** 2 - total ** 2;
  const root: number = Math.sqrt(halfB ** 2 - a * c);
  const height: number = halfB > 0 ? -c / (root + halfB) : (root - halfB) / a;
  if (!(Number.isFinite(height) && height > 0))
    throw new Error(
      "The requested leg cannot span the fixed ankle-to-hip alignment",
    );
  return [ankleY + height, ankleY + (height * tibia) / total];
}

/** Euclidean distance. */
function distance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
}

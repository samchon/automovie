import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * Trunk levels as fractions of the span from the mid-hip joint centre up to cervicale, from ANSUR II mean heights (Gordon et al. 2014, NATICK/TR-15/007) with the hip centre 3 mm above trochanterion (de Leva 1996, J Biomech 29(9):1223-1230), women and men pooled because the identity carries no sex. Fractions of the span rather than of stature, so the trunk keeps its internal proportions when a child's or an old person's trunk is short. Grade: derived.
 */
const TRUNK_LEVEL: Record<
  "omphalion" | "iliocristale" | "xiphion" | "axilla" | "suprasternale",
  number
> = {
  /** Navel, 0.241 (women) and 0.249 (men); the `spine` bone starts here, the top of de Leva's lower trunk. */
  omphalion: 0.245,
  /** Highest point of the iliac crest, 0.269 and 0.257. */
  iliocristale: 0.263,
  /** Xiphoid, from suprasternale down de Leva's upper-trunk share of suprasternale to mid-hip (142.5 of 529.3 mm women, 170.7 of 531.9 mm men), 0.643 and 0.592; the `chest` bone starts here, the top of de Leva's middle trunk. */
  xiphion: 0.617,
  /** Apex of the anterior axillary fold, 0.714 and 0.693; the `upperChest` bone starts here, where the shoulder girdle's muscles meet the rib cage, a conventional boundary. */
  axilla: 0.703,
  /** Jugular notch, 0.880 and 0.872. */
  suprasternale: 0.876,
};

/**
 * Place the pelvis, spine and neck.
 *
 * The root `hips` sits midway between the two hip joint centres. The spine joints stand above it at the trunk levels on the frontal plane through the hip centres, and the neck starts at cervicale height and ends at the head joint. Sagittal curvature (lumbar lordosis, thoracic kyphosis and its growth in old age) is not represented: no lordosis norm was read, and the old-age height loss is carried by the trunk heights instead. Cervicale and the jugular notch sit on the back and front of the neck, a neck-circumference radius from the axis; the ischial seat lies at stature minus sitting height.
 *
 * The spine, neck and pelvis use the engine's default axes: flexion bends forward about X, abduction bends to the right about Z, twist turns to the left about Y.
 *
 * @param body The body measurements
 * @param leftHip Left hip joint centre
 * @param rightHip Right hip joint centre
 * @param headJoint Head joint centre
 * @returns Pelvis, spine and neck joints, the jugular notch height and the trunk's landmarks
 */
export function placeAutoMovieHumanTrunk(
  body: IAutoMovieHumanIdentity.IBody,
  leftHip: IAutoMovieVector3,
  rightHip: IAutoMovieVector3,
  headJoint: IAutoMovieVector3,
): placeAutoMovieHumanTrunk.IOutput {
  const v: typeof AutoMovieHumanVector.of = AutoMovieHumanVector.of;
  const base: number = (leftHip.y + rightHip.y) / 2;
  const span: number = body.cervicaleHeight - base;
  const level: (fraction: number) => number = (fraction: number): number =>
    base + fraction * span;
  const axes: IAutoMovieHumanSkeleton.IAxes = {
    flexion: v(1, 0, 0),
    abduction: v(0, 0, 1),
    twist: v(0, 1, 0),
  };
  const points: IAutoMovieVector3[] = [
    v(0, base, 0),
    v(0, level(TRUNK_LEVEL.omphalion), 0),
    v(0, level(TRUNK_LEVEL.xiphion), 0),
    v(0, level(TRUNK_LEVEL.axilla), 0),
    v(0, body.cervicaleHeight, 0),
    headJoint,
  ];
  const bones: Array<IAutoMovieHumanSkeleton.IJoint["bone"]> = [
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
  ];
  const neckRadius: number = body.neckCircumference / (2 * Math.PI);
  const suprasternale: number = level(TRUNK_LEVEL.suprasternale);
  const crest: (s: number) => IAutoMovieHumanLandmarks.ILandmark = (
    s: number,
  ): IAutoMovieHumanLandmarks.ILandmark => ({
    bone: "hips",
    position: v(
      (s * body.bicristalBreadth) / 2,
      level(TRUNK_LEVEL.iliocristale),
      0,
    ),
  });
  return {
    suprasternale,
    joints: bones.map(
      (
        bone: IAutoMovieHumanSkeleton.IJoint["bone"],
        i: number,
      ): IAutoMovieHumanSkeleton.IJoint => ({
        bone,
        parent: i === 0 ? null : bones[i - 1]!,
        position: points[i]!,
        tail: points[i + 1]!,
        axes,
        constraint: null,
      }),
    ),
    landmarks: {
      cervicale: {
        bone: "upperChest",
        position: v(0, body.cervicaleHeight, -neckRadius),
      },
      suprasternale: {
        bone: "upperChest",
        position: v(0, suprasternale, neckRadius),
      },
      ischialSeat: {
        bone: "hips",
        position: v(0, body.stature - body.sittingHeight, 0),
      },
    },
    leftCrest: crest(1),
    rightCrest: crest(-1),
  };
}
/** Output type of {@link placeAutoMovieHumanTrunk}. */
export namespace placeAutoMovieHumanTrunk {
  /**
   * The placed trunk.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Height of the jugular notch, where the clavicles start, millimetres. */
    suprasternale: number;

    /** Hips, spine, chest, upper chest and neck, parents first. */
    joints: IAutoMovieHumanSkeleton.IJoint[];

    /** Midline trunk landmarks. */
    landmarks: Pick<
      IAutoMovieHumanLandmarks,
      "cervicale" | "suprasternale" | "ischialSeat"
    >;

    /** Left iliac crest top. */
    leftCrest: IAutoMovieHumanLandmarks.ILandmark;

    /** Right iliac crest top. */
    rightCrest: IAutoMovieHumanLandmarks.ILandmark;
  }
}

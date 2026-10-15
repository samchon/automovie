import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";
import { curveAutoMovieHumanSpine } from "./curveAutoMovieHumanSpine";

/**
 * Trunk levels as fractions of the span from the mid-hip joint centre up to cervicale, from ANSUR II mean heights (Gordon et al. 2014, NATICK/TR-15/007) with the hip centre 3 mm above trochanterion (de Leva 1996, J Biomech 29(9):1223-1230), women and men pooled because the identity carries no sex. Fractions of the span rather than of stature, so the trunk keeps its internal proportions when a child's or an old person's trunk is short. Grade: derived.
 */
const TRUNK_LEVEL: Record<
  "omphalion" | "iliocristale" | "xiphion" | "axilla",
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
};

/**
 * Place the pelvis, spine and neck.
 *
 * The root `hips` sits midway between the two hip joint centres. The spine joints stand above it at the trunk levels, on the vertebral column as it curves in the side view through the identity's posture ({@link curveAutoMovieHumanSpine}): the lumbar lordosis, the thoracic kyphosis and the pelvic tilt, with the neck at the measured sagittal vertical axis over the sacrum, so an old person's deeper kyphosis and backward-tilted pelvis stand the neck forward of the hips. The neck starts on the column at cervicale height; its end, the head joint, is placed with the head. Cervicale and the jugular notch sit on the back and front of the neck, a neck-circumference radius behind and in front of the column; the ischial seat lies at stature minus sitting height. The acromion, and the shoulder under it, stands in the coronal plane of the jugular notch at its own height, a neck radius in front of the column, so the shoulders lie over the hips in a young adult and round forward with an old person's upper thoracic curve; the placement is conventional, a check on renders. The arm itself is placed by `placeAutoMovieHumanArm`.
 *
 * The spine, neck and pelvis use the engine's default axes: flexion bends forward about X, abduction bends to the right about Z, twist turns to the left about Y.
 *
 * @param body The body measurements
 * @param leftHip Left hip joint centre
 * @param rightHip Right hip joint centre
 * @returns Pelvis and spine joints, the neck's start, the column and the trunk's landmarks
 */
export function placeAutoMovieHumanTrunk(
  body: IAutoMovieHumanIdentity.IBody,
  leftHip: IAutoMovieVector3,
  rightHip: IAutoMovieVector3,
): placeAutoMovieHumanTrunk.IOutput {
  const v: typeof AutoMovieHumanVector.of = AutoMovieHumanVector.of;
  const base: number = (leftHip.y + rightHip.y) / 2;
  const span: number = body.cervicaleHeight - base;
  const level: (fraction: number) => number = (fraction: number): number =>
    base + fraction * span;
  const crestHeight: number = level(TRUNK_LEVEL.iliocristale);
  const column: curveAutoMovieHumanSpine.IOutput = curveAutoMovieHumanSpine(
    body,
    base,
    crestHeight,
  );
  const on: (y: number) => IAutoMovieVector3 = (y: number): IAutoMovieVector3 =>
    v(0, y, column.at(y));
  const axes: IAutoMovieHumanSkeleton.IAxes = {
    flexion: v(1, 0, 0),
    abduction: v(0, 0, 1),
    twist: v(0, 1, 0),
  };
  const neck: IAutoMovieVector3 = on(body.cervicaleHeight);
  const points: IAutoMovieVector3[] = [
    v(0, base, (leftHip.z + rightHip.z) / 2),
    on(level(TRUNK_LEVEL.omphalion)),
    on(level(TRUNK_LEVEL.xiphion)),
    on(level(TRUNK_LEVEL.axilla)),
    neck,
  ];
  const bones: Array<IAutoMovieHumanSkeleton.IJoint["bone"]> = [
    "hips",
    "spine",
    "chest",
    "upperChest",
  ];
  const neckRadius: number = body.neckCircumference / (2 * Math.PI);
  const suprasternale: IAutoMovieVector3 = v(
    0,
    body.suprasternaleHeight,
    column.at(body.suprasternaleHeight) + neckRadius,
  );
  const crest: (s: number) => IAutoMovieHumanLandmarks.ILandmark = (
    s: number,
  ): IAutoMovieHumanLandmarks.ILandmark => ({
    bone: "hips",
    position: v((s * body.bicristalBreadth) / 2, crestHeight, 0),
  });
  return {
    suprasternale,
    shoulderDepth: column.at(body.acromialHeight) + neckRadius,
    column,
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
    neck: {
      bone: "neck",
      parent: "upperChest",
      position: neck,
      axes,
      constraint: null,
    },
    landmarks: {
      cervicale: {
        bone: "upperChest",
        position: v(0, body.cervicaleHeight, neck.z - neckRadius),
      },
      suprasternale: { bone: "upperChest", position: suprasternale },
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
    /** The jugular notch, where the clavicles start. */
    suprasternale: IAutoMovieVector3;

    /** Front-back position of the shoulders, a neck radius in front of the column at acromial height, millimetres. */
    shoulderDepth: number;

    /** The curved vertebral column. */
    column: curveAutoMovieHumanSpine.IOutput;

    /** Hips, spine, chest and upper chest, parents first. */
    joints: IAutoMovieHumanSkeleton.IJoint[];

    /** The neck joint, whose tail is the head joint the head placement gives. */
    neck: Omit<IAutoMovieHumanSkeleton.IJoint, "tail">;

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

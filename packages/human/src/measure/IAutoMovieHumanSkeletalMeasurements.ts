import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";

/**
 * The lengths, heights and breadths of an identity that a skeleton's landmarks measure, millimetres except the cephalic index.
 *
 * Measuring a generated skeleton returns these; comparing them with the identity's own values is the check that the skeleton honours every requested measurement. Girths, composition, mobility and pigmentation are not skeletal and are absent.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkeletalMeasurements {
  /** Body heights and breadths, and the lengths of each limb. */
  body: Pick<
    IAutoMovieHumanIdentity.IBody,
    | "stature"
    | "sittingHeight"
    | "cervicaleHeight"
    | "suprasternaleHeight"
    | "acromialHeight"
    | "biacromialBreadth"
    | "bicristalBreadth"
  > & {
    /** Left arm lengths. */
    leftArm: IAutoMovieHumanSkeletalMeasurements.IArm;

    /** Right arm lengths. */
    rightArm: IAutoMovieHumanSkeletalMeasurements.IArm;

    /** Left leg lengths. */
    leftLeg: IAutoMovieHumanSkeletalMeasurements.ILeg;

    /** Right leg lengths. */
    rightLeg: IAutoMovieHumanSkeletalMeasurements.ILeg;
  };

  /** Vault and face frame. */
  head: Pick<
    IAutoMovieHumanIdentity.IHead,
    | "headLength"
    | "cephalicIndex"
    | "headHeight"
    | "faceHeight"
    | "faceWidth"
    | "mandibularWidth"
    | "minimumFrontalWidth"
  >;
}
export namespace IAutoMovieHumanSkeletalMeasurements {
  /** Lengths of one arm. */
  export type IArm = Pick<
    IAutoMovieHumanIdentity.IArm,
    | "upperArmLength"
    | "forearmLength"
    | "handLength"
    | "handBreadth"
    | "palmLength"
    | "thumbLength"
  >;

  /** Lengths of one leg. */
  export type ILeg = Pick<
    IAutoMovieHumanIdentity.ILeg,
    "thighLength" | "shankLength" | "ankleHeight" | "footLength" | "footBreadth"
  >;
}

import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

const range: (min: number, max: number) => { min: number; max: number } = (
  min: number,
  max: number,
): { min: number; max: number } => ({ min, max });
const con: (
  flexion: { min: number; max: number } | null,
  abduction: { min: number; max: number } | null,
  twist: { min: number; max: number } | null,
) => IAutoMovieJointConstraint = (
  flexion: { min: number; max: number } | null,
  abduction: { min: number; max: number } | null,
  twist: { min: number; max: number } | null,
): IAutoMovieJointConstraint => ({ flexion, abduction, twist });
const legCon: IAutoMovieJointConstraint = con(
  range(-70, 80),
  range(-20, 35),
  range(-20, 20),
);
const kneeCon: IAutoMovieJointConstraint = con(range(0, 150), null, null);
const pawCon: IAutoMovieJointConstraint = con(range(-45, 45), null, null);
/**
 * Conventional authored degree ranges for the cat demo's spine/head, twelve limb slots and three tail slots; absent bones are unconstrained. Symmetric limbs alias shared leg/knee/paw records. buildCat borrows these module-owned rows; consumers must not mutate them. Their presence neither enables playback clamping nor establishes veterinary range, contact safety or admissible dimension combinations.
 *
 * @author Samchon
 */
export const CAT_ROM: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointConstraint>
> = {
  spine: con(range(-40, 55), range(-25, 25), range(-30, 30)),
  chest: con(range(-30, 45), range(-20, 20), range(-25, 25)),
  neck: con(range(-60, 70), range(-45, 45), range(-60, 60)),
  head: con(range(-50, 60), range(-45, 45), range(-70, 70)),
  leftUpperArm: legCon,
  rightUpperArm: legCon,
  leftLowerArm: kneeCon,
  rightLowerArm: kneeCon,
  leftHand: pawCon,
  rightHand: pawCon,
  leftUpperLeg: legCon,
  rightUpperLeg: legCon,
  leftLowerLeg: kneeCon,
  rightLowerLeg: kneeCon,
  leftFoot: pawCon,
  rightFoot: pawCon,
  // tail (repurposed finger chain): supple, curls and sways
  leftLittleProximal: con(range(-80, 80), range(-50, 50), null),
  leftLittleIntermediate: con(range(-80, 80), range(-50, 50), null),
  leftLittleDistal: con(range(-80, 80), range(-50, 50), null),
};

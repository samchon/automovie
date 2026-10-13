import type { AutoMovieHumanoidBone, IAutoMovieJointConstraint } from "@automovie/interface";
const range: (min: number, max: number) => { min: number; max: number; } = (min: number, max: number): { min: number; max: number; } => ({ min, max });
const con: (flexion: { min: number; max: number; } | null, abduction: { min: number; max: number; } | null, twist: { min: number; max: number; } | null) => IAutoMovieJointConstraint = (
  flexion: { min: number; max: number } | null,
  abduction: { min: number; max: number } | null,
  twist: { min: number; max: number } | null,
): IAutoMovieJointConstraint => ({ flexion, abduction, twist });
const legCon: IAutoMovieJointConstraint = con(range(-80, 90), range(-15, 25), range(-15, 15));
const kneeCon: IAutoMovieJointConstraint = con(range(-10, 150), null, null);
const hoofCon: IAutoMovieJointConstraint = con(range(-40, 40), null, null);
/**
 * Conventional authored degree ranges for the horse demo's spine/head, twelve limb slots and three tail slots; absent bones are unconstrained. Symmetric limbs alias shared leg/knee/hoof records. buildHorse borrows these module-owned rows; consumers must not mutate them. Their presence neither enables playback clamping nor establishes veterinary range, contact safety or admissible dimension combinations.
 *
 * @author Samchon
 */
export const HORSE_ROM: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointConstraint>
> = {
  spine: con(range(-45, 50), range(-20, 20), range(-25, 25)),
  chest: con(range(-35, 40), range(-15, 15), range(-20, 20)),
  neck: con(range(-70, 80), range(-40, 40), range(-40, 40)),
  head: con(range(-60, 60), range(-30, 30), range(-50, 50)),
  leftUpperArm: legCon,
  rightUpperArm: legCon,
  leftLowerArm: kneeCon,
  rightLowerArm: kneeCon,
  leftHand: hoofCon,
  rightHand: hoofCon,
  leftUpperLeg: legCon,
  rightUpperLeg: legCon,
  leftLowerLeg: kneeCon,
  rightLowerLeg: kneeCon,
  leftFoot: hoofCon,
  rightFoot: hoofCon,
  leftLittleProximal: con(range(-70, 70), range(-60, 60), null),
  leftLittleIntermediate: con(range(-70, 70), range(-60, 60), null),
  leftLittleDistal: con(range(-70, 70), range(-60, 60), null),
};

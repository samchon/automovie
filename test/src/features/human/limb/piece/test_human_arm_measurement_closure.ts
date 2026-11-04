import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanTrunkLandmarks } from "../../../../../../packages/human/src/generation/AutoMovieHumanTrunkLandmarks";
import { AutoMovieHumanArmBones } from "../../../../../../packages/human/src/generation/arm/AutoMovieHumanArmBones";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * The chosen GH placement and rigid arm lengths close their public calipers
 * in the declared straight measuring convention before carrying them to bind.
 * This is not a claim that every person's clinical carrying angle is zero.
 *
 * Scenarios:
 * 1. Actual selected-person AR and RS close at their own landmarks.
 * 2. Translating the measuring acromion changes no calibrated length.
 *
 * @evidence contracts/testing.md#behavioral-verification Combines the actual trunk GH placement with ArmBones.place using the production limb inputs, without a body realization or a replacement bone rule.
 * @evidence contracts/testing.md#independent-expectations ANSUR's axis-parallel calipers measure the radiale projection from acromion and stylion projection from radiale. The independent world-point projections expose the former incompatible GH offset even when each component alone was finite.
 * @evidence contracts/testing.md#distinguishing-cases Both an origin and a translated calibration frame use all environment-selected people; upper and lower public lengths have separate landmark checks.
 * @evidence contracts/testing.md#execution-ownership Synchronous pure geometry with no final skin, rig, process, renderer, GPU or private reference reading.
 */
export function test_human_arm_measurement_closure(): void {
  const defects: string[] = [];
  const down: [number, number, number] = [0, -1, 0];
  for (const name of HumanPeople.names()) {
    const input: AutoMovieHumanBodyLaw.ILimbInputs = AutoMovieHumanBodyLaw.limbInputs(HumanPeople.params(name));
    for (const acromion of [[0, 0, 0], [input.stature, input.stature, input.stature]] as [number, number, number][]) {
      const gh: [number, number, number] = AutoMovieHumanTrunkLandmarks.glenohumeral(acromion, input.arms.upper);
      const bones: AutoMovieHumanArmBones.IBones = AutoMovieHumanArmBones.place(gh, down, down, input.arms.upper, input.arms.lower);
      const upper: number = acromion[1] - bones.radiale[1];
      const lower: number = bones.radiale[1] - bones.stylion[1];
      if (Math.abs(upper - input.arms.upper) > 1e-9) defects.push(`${name}: neutral acromion-radiale ${upper} mm does not close ${input.arms.upper} mm`);
      if (Math.abs(lower - input.arms.lower) > 1e-9) defects.push(`${name}: neutral radiale-stylion ${lower} mm does not close ${input.arms.lower} mm`);
      console.log(JSON.stringify({ person: name, acromion, gh, radiale: bones.radiale, stylion: bones.stylion, publicUpper: input.arms.upper, actualUpper: upper, publicLower: input.arms.lower, actualLower: lower, measuringConvention: "straight-neutral" }));
    }
  }
  if (defects.length !== 0) throw new Error(defects.join("\n"));
}

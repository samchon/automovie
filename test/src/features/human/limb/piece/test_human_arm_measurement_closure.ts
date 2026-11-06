import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanTrunkLandmarks } from "../../../../../../packages/human/src/generation/AutoMovieHumanTrunkLandmarks";
import { AutoMovieHumanArmBones } from "../../../../../../packages/human/src/generation/arm/AutoMovieHumanArmBones";
import { HumanPeople } from "../../../internal/HumanPeople";
import { AutoMovieHumanShoulderJoint } from "../../../../../../packages/human/src/generation/AutoMovieHumanShoulderJoint";

/**
 * The chosen GH placement and rigid arm lengths close their public calipers
 * in the declared straight measuring convention before carrying them to bind.
 * This is not a claim that every person's clinical carrying angle is zero.
 *
 * Scenarios:
 * 1. Actual selected-person AR and RS close at their own landmarks.
 * 2. Translating the measuring acromion changes no calibrated length.
 * 3. An independent 3-4-5 frontal chord fixes generic signs, physical-mm
 *    scaling, sided reflection and the right-handed triad; malformed inputs refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Combines the actual trunk GH placement with ArmBones.place using the production limb inputs, without a body realization or a replacement bone rule.
 * @evidence contracts/testing.md#independent-expectations ANSUR's axis-parallel calipers measure radiale from acromion and stylion from radiale. The 3-4-5 constructed frame gives axes [1,0,0],[0,.6,-.8],[0,.8,.6] and canonical-right generic displacement [12,-24.6,42.8] mm before reflection, independently of the placement helper. These are population/frame-transfer construction expectations, not anatomical GH validation.
 * @evidence contracts/testing.md#distinguishing-cases Origin/translated AR and RS use all selected people. Both sides and calibration scales .5/1/2 distinguish direct-world addition, wrong signs and double scaling. Orthonormality and invalid zero/NaN scale distinguish accepted geometry from malformed transfer.
 * @evidence contracts/testing.md#execution-ownership Synchronous pure geometry with no final skin, rig, process, renderer, GPU or private reference reading.
 */
export function test_human_arm_measurement_closure(): void {
  const defects: string[] = [];
  const down: [number, number, number] = [0, -1, 0];
  for (const name of HumanPeople.names()) {
    const input: AutoMovieHumanBodyLaw.ILimbInputs = AutoMovieHumanBodyLaw.limbInputs(HumanPeople.params(name));
    for (const acromion of [[0, 0, 0], [input.stature, input.stature, input.stature]] as [number, number, number][]) {
      const neck: [number, number, number] = [acromion[0], acromion[1] + 40 * input.arms.scale, acromion[2] - 30 * input.arms.scale];
      const gh: [number, number, number] = AutoMovieHumanTrunkLandmarks.glenohumeral(acromion, neck, input.arms.scale);
      const bones: AutoMovieHumanArmBones.IBones = AutoMovieHumanArmBones.place(gh, down, down, input.arms.upper, input.arms.lower, acromion[1] - gh[1]);
      const upper: number = acromion[1] - bones.radiale[1];
      const lower: number = bones.radiale[1] - bones.stylion[1];
      if (Math.abs(upper - input.arms.upper) > 1e-9) defects.push(`${name}: neutral acromion-radiale ${upper} mm does not close ${input.arms.upper} mm`);
      if (Math.abs(lower - input.arms.lower) > 1e-9) defects.push(`${name}: neutral radiale-stylion ${lower} mm does not close ${input.arms.lower} mm`);
      console.log(JSON.stringify({ person: name, acromion, gh, radiale: bones.radiale, stylion: bones.stylion, publicUpper: input.arms.upper, actualUpper: upper, publicLower: input.arms.lower, actualLower: lower, measuringConvention: "straight-neutral" }));
    }
  }
  for (const scale of [0.5, 1, 2]) for (const side of [1, -1] as const) {
    const a: [number, number, number] = [10 * scale, 100 * scale, side * 50 * scale];
    const n: [number, number, number] = [10 * scale, 140 * scale, side * 20 * scale];
    const placed: AutoMovieHumanShoulderJoint.IPlacement = AutoMovieHumanShoulderJoint.of(a, n, scale, side);
    const expected: [number, number, number] = [22 * scale, 75.4 * scale, side * 7.2 * scale];
    if (placed.centre.some((value: number, c: number): boolean => Math.abs(value - expected[c]!) > 1e-10)) defects.push(`Generic frame/sign/unit transfer failed at scale ${scale}, side ${side}: ${placed.centre}`);
    const shift: [number, number, number] = [77, -31, side * 52];
    const translated: AutoMovieHumanShoulderJoint.IPlacement = AutoMovieHumanShoulderJoint.of(a.map((value: number, c: number): number => value + shift[c]!), n.map((value: number, c: number): number => value + shift[c]!), scale, side);
    if (translated.centre.some((value: number, c: number): boolean => Math.abs(value - expected[c]! - shift[c]!) > 1e-10)) defects.push("Generic authored frame depends on the world origin");
    for (const [i, axis] of placed.axes.entries()) for (const [j, other] of placed.axes.entries()) {
      const product: number = axis.reduce((sum: number, value: number, c: number): number => sum + value * other[c]!, 0);
      if (Math.abs(product - (i === j ? 1 : 0)) > 1e-12) defects.push("Generic authored triad is not orthonormal");
    }
  }
  for (const scale of [0, NaN]) {
    let refused: boolean = false;
    try { AutoMovieHumanShoulderJoint.of([0, 0, 1], [0, 1, 0], scale); } catch { refused = true; }
    if (!refused) defects.push(`Generic transfer accepted invalid scale ${scale}`);
  }
  let degenerate: boolean = false;
  try { AutoMovieHumanShoulderJoint.of([0, 0, 1], [5, 0, 1], 1); } catch { degenerate = true; }
  if (!degenerate) defects.push("Generic transfer accepted a zero frontal short bar");
  if (defects.length !== 0) throw new Error(defects.join("\n"));
}

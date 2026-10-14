import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IHumanBodyPelvifemoralResult } from "./IHumanBodyPelvifemoralResult";
import { evaluateHumanBodyRhythmCurve } from "./evaluateHumanBodyRhythmCurve";

const LEGS: readonly ["leftUpperLeg", "rightUpperLeg"] = [
  "leftUpperLeg",
  "rightUpperLeg",
];

/**
 * Apply a basis's declared pelvifemoral rhythm to a coupled clinical pose.
 *
 * `resolveHumanBodyCouplings` calls this to list the rhythm's additions for the editor, and the builder calls it to obtain the tilt it turns the pelvis by. The build-pose owner validates the resulting actual frames separately. Input: the coupled joints, in which each upper leg's flexion is the document's trunk-relative flexion (rest when absent). Output: fresh entries in which the root (`hips`) carries `-T` on flexion, the lumbar joint `+T` and each upper leg `flexion - T` (the sagittal coordination increments), and the list of those additions. `T` is the declared curve at the larger of the two legs' trunk-relative flexions, read by `evaluateHumanBodyRhythmCurve`: zero at and below the first knot (within its nanodegree first-knot tolerance), linear between knots, the last ordinate held past the last knot, so the rest and every extension add nothing.
 *
 * The rhythm runs after the couplings, none of which may drive the legs' or the lumbar joint's flexion (admission), so the input angles are the document's. Forward kinematics and the corrective ramps read those coupled angles. These scalar additions describe coordination; combined abduction/twist or an oblique shaped frame need not produce these clinical totals. The shared build-pose resolver turns the pelvis about the hip centres and validates the actual parent-relative clinical coordinates. This function only publishes the declared curve's scalar increments.
 *
 * @evidence contracts/common.md#principled-implementation The admitted rhythm curve reads the larger coupled trunk-relative leg flexion and publishes coordinated root/lumbar/leg scalar increments while the build owner performs and validates actual pelvis-relative frames separately.
 * @evidence contracts/common.md#clear-and-simple-design A copied joint array, neutral lookup and shared degree-curve reader produce both coordinated rows and named contribution observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No output scalar sum substitutes for actual combined clinical readout; source chain/coupling independence is an admitted basis premise, and an absent or zero rhythm preserves copied input rows.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies coupled input, trunk-relative legs, signed T increments, curve endpoint policy and the actual-frame owner's separate authority.
 * @evidence contracts/performance.md#efficient-algorithms Copying pose and building neutral lookup are linear; two leg reads and four output updates scan copied rows, while curve lookup scans its K knots, keeping overall work O(J+P+K).
 * @evidence contracts/performance.md#reuse-equivalent-work One neutral map and one computed tilt serve all coordinated outputs; the same rhythm owner supplies editor observations and the build's pelvis turn.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copied joints and contribution records transfer to the caller; neutral lookup and helper closures expire after return, with no retained basis cache, external handle or task.
 */
export function resolveHumanBodyPelvifemoralRhythm(
  basis: Pick<IAutoMovieHumanBodyBasis, "joints" | "pelvifemoral">,
  joints: readonly IAutoMovieJointPose[],
): IHumanBodyPelvifemoralResult {
  const result: IAutoMovieJointPose[] = joints.map(
    (joint: IAutoMovieJointPose): IAutoMovieJointPose => ({ ...joint }),
  );
  const rhythm: typeof basis.pelvifemoral = basis.pelvifemoral;
  if (rhythm === undefined) return { joints: result, contributions: [] };
  const neutral: Map<AutoMovieHumanoidBone, number> = new Map(
    basis.joints.map(
      (
        joint: (typeof basis.joints)[number],
      ): [AutoMovieHumanoidBone, number] => [joint.bone, joint.neutral.flexion],
    ),
  );
  const flexion: (bone: AutoMovieHumanoidBone) => number = (
    bone: AutoMovieHumanoidBone,
  ): number =>
    // every chain bone is a declared joint (admission), so the rest exists
    (result.find((joint: IAutoMovieJointPose): boolean => joint.bone === bone)
      ?.flexion ?? neutral.get(bone)) as number;
  const tilt: number = evaluateHumanBodyRhythmCurve(
    rhythm.curve,
    Math.max(...LEGS.map(flexion)),
  );
  if (tilt === 0) return { joints: result, contributions: [] };
  const contributions: ReturnType<
    typeof resolveHumanBodyPelvifemoralRhythm
  >["contributions"] = [];
  const add: (bone: AutoMovieHumanoidBone, degrees: number) => void = (
    bone: AutoMovieHumanoidBone,
    degrees: number,
  ): void => {
    const index: number = result.findIndex(
      (joint: IAutoMovieJointPose): boolean => joint.bone === bone,
    );
    const next: IAutoMovieJointPose = {
      bone,
      flexion: flexion(bone) + degrees,
      abduction: index < 0 ? null : result[index].abduction,
      twist: index < 0 ? null : result[index].twist,
    };
    if (index < 0) result.push(next);
    else result[index] = next;
    contributions.push({ coupling: rhythm.id, bone, axis: "flexion", degrees });
  };
  add("hips", -tilt);
  add(rhythm.lumbar, tilt);
  for (const leg of LEGS) add(leg, -tilt);
  return { joints: result, contributions };
}

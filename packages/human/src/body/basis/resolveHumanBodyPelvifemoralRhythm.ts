import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { evaluateHumanBodyRhythmCurve } from "./evaluateHumanBodyRhythmCurve";
import type { IHumanBodyPelvifemoralResult } from "./IHumanBodyPelvifemoralResult";

const LEGS = ["leftUpperLeg", "rightUpperLeg"] as const;

/**
 * Apply a basis's declared pelvifemoral rhythm to a coupled clinical pose.
 *
 * `resolveHumanBodyCouplings` calls this to list the rhythm's additions for
 * the editor, and the builder calls it to obtain the tilt it turns the pelvis
 * by. The build-pose owner validates the resulting actual frames separately.
 * Input: the coupled joints, in which each
 * upper leg's flexion is the document's trunk-relative flexion (rest when
 * absent). Output: fresh entries in which the root (`hips`) carries `-T` on
 * flexion, the lumbar joint `+T` and each upper leg `flexion - T` (the
 * sagittal coordination increments), and the list of those
 * additions. `T` is the declared curve at the larger of the two legs'
 * trunk-relative flexions, read by `evaluateHumanBodyRhythmCurve`: zero at and
 * below the first knot (within its nanodegree first-knot tolerance), linear
 * between knots, the last ordinate held past the last knot, so the rest and
 * every extension add nothing.
 *
 * The rhythm runs after the couplings, none of which may drive the legs' or
 * the lumbar joint's flexion (admission), so the input angles are the
 * document's. Forward kinematics and the corrective ramps read those
 * coupled angles. These scalar additions describe coordination; combined
 * abduction/twist or an oblique shaped frame need not produce these clinical
 * totals. The shared build-pose resolver turns the pelvis about the hip centres
 * and validates the actual parent-relative clinical coordinates. This function
 * only publishes the declared curve's scalar increments.
 */
export function resolveHumanBodyPelvifemoralRhythm(
  basis: Pick<IAutoMovieHumanBodyBasis, "joints" | "pelvifemoral">,
  joints: readonly IAutoMovieJointPose[],
): IHumanBodyPelvifemoralResult {
  const result = joints.map((joint) => ({ ...joint }));
  const rhythm = basis.pelvifemoral;
  if (rhythm === undefined) return { joints: result, contributions: [] };
  const neutral = new Map(
    basis.joints.map((joint) => [joint.bone, joint.neutral.flexion]),
  );
  const flexion = (bone: AutoMovieHumanoidBone): number =>
    // every chain bone is a declared joint (admission), so the rest exists
    (result.find((joint) => joint.bone === bone)?.flexion ??
      neutral.get(bone)) as number;
  const tilt = evaluateHumanBodyRhythmCurve(rhythm.curve, Math.max(...LEGS.map(flexion)));
  if (tilt === 0) return { joints: result, contributions: [] };
  const contributions: ReturnType<
    typeof resolveHumanBodyPelvifemoralRhythm
  >["contributions"] = [];
  const add = (bone: AutoMovieHumanoidBone, degrees: number): void => {
    const index = result.findIndex((joint) => joint.bone === bone);
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

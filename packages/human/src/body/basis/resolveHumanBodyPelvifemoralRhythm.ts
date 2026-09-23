import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

const LEGS = ["leftUpperLeg", "rightUpperLeg"] as const;

/**
 * Apply a basis's declared pelvifemoral rhythm to a coupled clinical pose.
 *
 * `resolveHumanBodyCouplings` calls this to list the rhythm's additions for
 * the editor, and the builder calls it to obtain the pose it validates and
 * the tilt it turns the pelvis by. Input: the coupled joints, in which each
 * upper leg's flexion is the document's trunk-relative flexion (rest when
 * absent). Output: fresh entries in which the root (`hips`) carries `-T` on
 * flexion, the lumbar joint `+T` and each upper leg `flexion - T` (the
 * pelvic-relative angles the rig ends up with), and the list of those
 * additions. `T` is the declared curve at the larger of the two legs'
 * trunk-relative flexions: zero at and below the first knot, linear between
 * knots, the last ordinate held past the last knot, so the rest and every
 * extension add nothing.
 *
 * The rhythm runs after the couplings, none of which may drive the legs' or
 * the lumbar joint's flexion (admission), so the input angles are the
 * document's. Forward kinematics and the corrective ramps read those
 * coupled angles; these outputs are what the engine's range validation
 * judges, next to the coupled angles themselves. The pelvis turn about the
 * hip centres is the builder's; this function only produces angles.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Moves the pelvis and lumbar spine with a lifted thigh by a declared, cited rhythm instead of posing hip flexion against a fixed pelvis.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Derives the shared tilt from the larger trunk-relative leg flexion and the pelvic-relative root, lumbar and hip angles the pose validation judges.
 */
export function resolveHumanBodyPelvifemoralRhythm(
  basis: Pick<IAutoMovieHumanBodyBasis, "joints" | "pelvifemoral">,
  joints: readonly IAutoMovieJointPose[],
): {
  joints: IAutoMovieJointPose[];
  contributions: {
    coupling: string;
    bone: AutoMovieHumanoidBone;
    axis: "flexion";
    degrees: number;
  }[];
} {
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
  const tilt = evaluate(rhythm.curve, Math.max(...LEGS.map(flexion)));
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

/** The curve at one flexion: zero at and below the first knot, linear between, the last ordinate held. */
function evaluate(curve: [number, number][], flexion: number): number {
  if (!(flexion > curve[0][0])) return 0;
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1];
    const [x1, y1] = curve[i];
    if (flexion < x1) return y0 + ((y1 - y0) * (flexion - x0)) / (x1 - x0);
  }
  return curve[curve.length - 1][1];
}

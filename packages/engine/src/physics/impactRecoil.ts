import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieRecoilPush,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { clampJointRom } from "../rom/internal/clampJointRom";
import { getConstraint } from "../rom/internal/getConstraint";

/**
 * Scale one input deflection down the recoil chain. An absent or zero push is
 * represented as `null`, the pose model's resting axis, so a zero-excluding ROM
 * does not drag an untouched axis to its minimum and the resulting pose remains
 * legal under the same validator. A non-zero deflection stays explicit for the
 * shared whole-joint ROM clamp.
 */
function scaledPushAxis(value: number | null, scale: number): number | null {
  if (value === null) return null;
  const scaled: number = value * scale;
  return scaled === 0 ? null : scaled;
}

function readPushAxis(value: number | undefined): number | null {
  return value === undefined || value === 0 ? null : value;
}

/**
 * Build the **flinch** a struck body yields under an impact: the reactive
 * `push` (a deflection driven by the impulse) propagates down a `chain` of
 * bones (from the contact bone toward the body) losing strength by `falloff`
 * each link, and **each joint only yields as far as its ROM allows**
 * ({@link IAutoMovieJointConstraint}). So what the hit _does_ to the body is
 * bounded by the same joint ranges the engine already validates against: a neck
 * can only snap so far, a spine only bend so much.
 *
 * This is the ROM-aware half of collision response: the reactive force decides
 * how hard the push is, the joint ROM decides how far the body actually goes.
 * The caller maps an {@link IAutoMovieImpact}'s impulse to the `push`
 * magnitude.
 */
export const impactRecoil: (
  push: IAutoMovieRecoilPush,
  chain: AutoMovieHumanoidBone[],
  skeleton: IAutoMovieSkeleton,
  falloff?: number,
) => IAutoMoviePose = (
  push: IAutoMovieRecoilPush,
  chain: AutoMovieHumanoidBone[],
  skeleton: IAutoMovieSkeleton,
  falloff: number = 0.6,
): IAutoMoviePose => {
  if (falloff < 0 || falloff > 1)
    throw new RangeError(
      `impact recoil falloff must be within [0, 1], but was ${falloff}`,
    );

  const flexion: number | null = readPushAxis(push.flexion);
  const abduction: number | null = readPushAxis(push.abduction);
  const twist: number | null = readPushAxis(push.twist);

  const joints: IAutoMovieJointPose[] = chain.map(
    (bone: AutoMovieHumanoidBone, i: number): IAutoMovieJointPose => {
      const configured: IAutoMovieBone | undefined = skeleton.bones.find(
        (entry: IAutoMovieBone): boolean => entry.bone === bone,
      );
      const constraint: IAutoMovieJointConstraint | null =
        configured === undefined
          ? null
          : getConstraint(bone, configured.constraint);
      const k: number = Math.pow(falloff, i);
      const recoil: IAutoMovieJointPose = {
        bone,
        flexion: scaledPushAxis(flexion, k),
        abduction: scaledPushAxis(abduction, k),
        twist: scaledPushAxis(twist, k),
      };
      return constraint === null ? recoil : clampJointRom(recoil, constraint);
    },
  );
  return { skeleton: skeleton.id, root: null, joints };
};

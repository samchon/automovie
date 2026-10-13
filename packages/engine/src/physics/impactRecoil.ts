import type { IAutoMovieBone, IAutoMovieJointConstraint, AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMoviePose, IAutoMovieSkeleton } from "@automovie/interface";


import { clampJointRom } from "../rom/clampJointRom";
import { getConstraint } from "../rom/getConstraint";
import { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";

/**
 * Scale one input deflection down the recoil chain. An absent or zero push is
 * represented as `null`, the pose model's resting axis, so a zero-excluding ROM
 * does not drag an untouched axis to its minimum and the resulting pose remains
 * legal under the same validator. A non-zero deflection stays explicit for the
 * shared whole-joint ROM clamp.
 */
const scaledPushAxis: (value: number | null, scale: number) => number | null = (value: number | null, scale: number): number | null => {
  if (value === null) return null;
  const scaled: number = value * scale;
  return scaled === 0 ? null : scaled;
};

const readPushAxis: (axis: keyof IAutoMovieRecoilPush, value: number | undefined) => number | null = (
  axis: keyof IAutoMovieRecoilPush,
  value: number | undefined,
): number | null => {
  if (value === undefined || value === 0) return null;
  if (!Number.isFinite(value))
    throw new RangeError(
      `impact recoil push ${axis} must be finite, but was ${value}`,
    );
  return value;
};

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
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Scale requested nonzero clinical axes along the chain by falloff^index, then clamp known bones through skeleton constraints and coupled ROM projection. Missing bones remain unclamped, and this is a pose heuristic rather than angular impulse integration.
 * @evidence contracts/common.md#clear-and-simple-design The chain defines spatial falloff while clampJointRom owns constraint semantics; absent or all-zero axes return null instead of authoring a rest pose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Default falloff 0.6 is the exposed recoil policy; it does not vary by fixture. A nonzero target in a zero-excluding range clamps to that range's minimum rather than adding to a neutral angle.
 * @evidence contracts/common.md#meaningful-documentation Docs identify degree targets, finite falloff in [0,1], invalid-input throws, null for no requested response and the missing-bone limitation.
 * @evidence contracts/performance.md#efficient-algorithms C chain entries each search B skeleton bones, so O(CB) lookup plus constraint projection and O(C) output; no whole-model simulation is performed.
 * @evidence contracts/performance.md#reuse-equivalent-work Constraint helpers are reused, but poses are fresh per push/chain/skeleton evaluation; mutable joint ranges rule out an identity-only cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned pose owns its new joint records; temporary chain work and failed calls retain no handles or ongoing simulation.
 */
export const impactRecoil: (push: IAutoMovieRecoilPush, chain: AutoMovieHumanoidBone [ ], skeleton: IAutoMovieSkeleton, falloff?: number) => IAutoMoviePose = (
  push: IAutoMovieRecoilPush,
  chain: AutoMovieHumanoidBone[],
  skeleton: IAutoMovieSkeleton,
  falloff: number = 0.6,
): IAutoMoviePose => {
  if (!Number.isFinite(falloff))
    throw new RangeError(
      `impact recoil falloff must be finite, but was ${falloff}`,
    );
  if (falloff < 0 || falloff > 1)
    throw new RangeError(
      `impact recoil falloff must be within [0, 1], but was ${falloff}`,
    );

  const flexion: number | null = readPushAxis("flexion", push.flexion);
  const abduction: number | null = readPushAxis("abduction", push.abduction);
  const twist: number | null = readPushAxis("twist", push.twist);

  const joints: IAutoMovieJointPose[] = chain.map((bone: AutoMovieHumanoidBone, i: number) : IAutoMovieJointPose => {
    const configured: IAutoMovieBone | undefined = skeleton.bones.find((entry: IAutoMovieBone) : boolean => entry.bone === bone);
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
  });
  return { skeleton: skeleton.id, root: null, joints };
};

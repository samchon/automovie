import { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMoviePose, IAutoMovieSkeleton } from "@automovie/interface";
import { clampJointRom } from "../rom/clampJointRom";
import { getConstraint } from "../rom/getConstraint";
import { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";

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
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Applies the contact reaction without exceeding declared joint range.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Produces the ROM-bounded pose consequence of world contact.
 * @author Samchon
 */
export const impactRecoil = (
  push: IAutoMovieRecoilPush,
  chain: AutoMovieHumanoidBone[],
  skeleton: IAutoMovieSkeleton,
  falloff = 0.6,
): IAutoMoviePose => {
  if (!Number.isFinite(falloff))
    throw new RangeError(
      `impact recoil falloff must be finite, but was ${falloff}`,
    );
  if (falloff < 0 || falloff > 1)
    throw new RangeError(
      `impact recoil falloff must be within [0, 1], but was ${falloff}`,
    );

  const flexion = readPushAxis("flexion", push.flexion);
  const abduction = readPushAxis("abduction", push.abduction);
  const twist = readPushAxis("twist", push.twist);

  const joints: IAutoMovieJointPose[] = chain.map((bone, i) => {
    const configured = skeleton.bones.find((entry) => entry.bone === bone);
    const constraint =
      configured === undefined
        ? null
        : getConstraint(bone, configured.constraint);
    const k = Math.pow(falloff, i);
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

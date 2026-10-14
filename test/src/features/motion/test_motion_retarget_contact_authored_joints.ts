import { retargetHumanoidMotion } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";
import {
  keyframeWorld,
  mapped,
  posedRootShiftClip,
  proportionedRig,
} from "../internal/retargetRigs";

/** Sorted bone names, retaining duplicate entries so a duplicated chain joint remains visible. */
const bonesOf: (
  joints: readonly { bone: AutoMovieHumanoidBone }[],
) => string[] = (
  joints: readonly { bone: AutoMovieHumanoidBone }[],
): string[] =>
  joints
    .map((j: { bone: AutoMovieHumanoidBone }): AutoMovieHumanoidBone => j.bone)
    .sort((a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone): number =>
      a < b ? -1 : a > b ? 1 : 0,
    );

/**
 * Observe replacement of authored pinned-leg joints and preservation of an unrelated spine joint, together with achieved mapped left-foot contact. Sparse bone uniqueness and literal articulation constrain the rewrite independently of shared FK observations.
 *
 * Sparse pose entries must remain unique by bone. The fit owner removes its own upper/lower entries before appending correction, so the exact sorted names below expose duplicate authored-plus-solved joints rather than letting FK hide them.
 *
 * The unchanged clip authors a spine bend and a bent left leg; contact tolerance 0.5 admits the articulated feet into the correction band.
 *
 * Scenarios:
 *
 * 1. The corrected pose names each bone exactly once: the two authored leg joints
 *    are replaced, not duplicated, and both right-leg joints are added.
 * 2. The authored spine joint is carried through untouched, angles and all.
 * 3. The authored left-leg angles are gone: the solved knee differs from the 12
 *    degrees the clip wrote.
 * 4. The point of the rewrite holds: the left foot ends on the mapped source
 *    contact within 0.005, which the authored angles alone missed.
 *
 * @evidence contracts/testing.md#behavioral-verification Retargets the posed clip under the existing broad contact tolerance, requires success, counts exact sorted bone identities, observes unchanged spine angles and a changed knee, and measures the rewritten left foot against the mapped source contact.
 * @evidence contracts/testing.md#independent-expectations The local authored spine value 5, knee value 12 and five-name set give expectations independent of correction; repeated names remain visible in the sorted array. Source FK and the explicit componentwise rootScale mapping define the original contact target, but shared clinical FK is a consumer rather than an independent geometry implementation. Original exact spine numbers and 1e-3/5e-3 change/contact tolerances remain.
 * @evidence contracts/testing.md#distinguishing-cases Retains unrelated spine versus replaced upper/lower leg joints, added opposite-leg joints, explicit non-rest articulation, broad 0.5 contact detection and the mapped left-foot check. Missing/unreachable chains and declared hands belong to separate retarget units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns the retarget and FK observations over the unchanged synthetic fixture. The local name reader and shared fixture helpers register no cases and start no viewer, process or native artifact.
 */
export function test_motion_retarget_contact_authored_joints(): void {
  const source: IAutoMovieSkeleton = proportionedRig("authored-source");
  const target: IAutoMovieSkeleton = proportionedRig("authored-target", {
    leg: 1.05,
    torso: 0.98,
  });
  const motion: IAutoMovieMotion = posedRootShiftClip(
    source.id,
    { x: 0, y: 0, z: 0.2 },
    [
      joint("spine", { flexion: 5 }),
      joint("leftUpperLeg", { flexion: 8 }),
      joint("leftLowerLeg", { flexion: 12 }),
    ],
  );

  const pinned: ReturnType<typeof retargetHumanoidMotion> =
    retargetHumanoidMotion({
      motion,
      source,
      target,
      contacts: { tolerance: 0.5 },
    });
  TestValidator.equals("authored-joint retarget succeeds", pinned.validation, {
    success: true,
  });
  if (pinned.motion === null || pinned.characterization === null)
    throw new Error("authored-joint retarget unexpectedly failed");

  const joints: IAutoMovieJointPose[] = pinned.motion.keyframes[0]!.pose.joints;

  // 1. every bone appears exactly once.
  TestValidator.equals(
    "the correction replaces the authored leg joints instead of duplicating them",
    bonesOf(joints),
    ["leftLowerLeg", "leftUpperLeg", "rightLowerLeg", "rightUpperLeg", "spine"],
  );

  // 2. an unrelated authored joint survives verbatim.
  TestValidator.predicate(
    "the authored spine bend is carried through",
    ((): boolean => {
      const spine: IAutoMovieJointPose | undefined = joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === "spine",
      );
      return (
        spine !== undefined &&
        spine.bone === "spine" &&
        spine.flexion !== null &&
        nclose(spine.flexion, 5, 0) &&
        spine.abduction === null &&
        spine.twist === null
      );
    })(),
  );

  // 3. the pinned limb's authored angles are superseded.
  const knee: IAutoMovieJointPose = joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "leftLowerLeg",
  )!;
  TestValidator.equals(
    "the solved knee is not the authored 12 degrees",
    namedFacts([
      ["kneeFlexion", (): boolean => knee.flexion !== null],
      [
        "ncloseKneeFlexion",
        (): boolean =>
          knee.flexion !== null && nclose(knee.flexion, 12, 1e-3) === false,
      ],
    ]),
    { kneeFlexion: true, ncloseKneeFlexion: true },
  );

  // 4. and the foot lands on the mapped source contact.
  TestValidator.predicate(
    "the rewritten leg holds the mapped contact",
    vclose(
      keyframeWorld(target, pinned.motion, 0, "leftFoot"),
      mapped(
        keyframeWorld(source, motion, 0, "leftFoot"),
        pinned.characterization.rootScale,
      ),
      5e-3,
    ),
  );
}

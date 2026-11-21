import {
  ROM_TOLERANCE,
  getConstraint,
  isPhysicalProfilePairExcluded,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanDigitFit } from "../posture/HumanDigitFit";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";

/**
 * The relaxed arm's least shoulder abduction that leaves the arm and its
 * digits clear of the body in a quiet stance: no upper arm, forearm or palm
 * enters a collider outside its own arm but where the profile declares the
 * pair overlapping at a pivot, and no digit sinks. The elbow stays at the
 * standing law's `stand.ELBOW` and the digits in the relaxed shape; wider
 * bodies need wider hanging arms. The depth is measured before any digit
 * clearing changes that shape. Bisection ends at the engine's joint-angle
 * resolution.
 *
 * @param body The body.
 * @returns The two arms' and hands' clinical angles, cached for this body.
 * @throws {Error} When the shoulder has no abduction range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture, the measured clearance, the search resolution and the cache's identity.
 * @evidence contracts/development/implementation.md#principled-implementation Bisects the abduction range on the arm hulls' and digit capsules' signed penetration of the rest of the body in the quiet stance, skipping the profile's declared pivot overlaps. It assumes that swinging the hanging arm outward clears both; the model's shoulder range is the bracket.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Shape, signed-depth predicate, range bracket, bisection, cached answer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the existing hand shape, shoulder range, quiet stance, digit depth and angle resolution; no body-specific angle is chosen.
 * @evidence contracts/development/implementation.md#efficient-algorithms For a rigid hanging arm, each abduction resolves the two shoulder frames and tests the fixed phalanges against relative collider frames. Unsupported or contact-boundary cases perform the original carried-bone FK and physical distance checks.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A candidate's pose is the first one's with the two upper-arm records clamped anew: assembly clamps each direct joint on its own, the stance's leg fits read no arm and it asks no arm or digit goal, so nothing else of the resolve depends on the abduction. The colliders of bones no upper arm carries are the same in every candidate. The weak body cache owns only the final relaxed record.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local FK reader, bounded ROM metadata projector and one fixed authored two-foot stance end with this synchronous search and never enter HUNG; hand-angle tuples retained by the final relaxed record keep its weak body ownership, and solved candidates do not escape.
 */
export function standRelaxed(
  body: IAutoMovieMotionHumanBody,
): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
  const known:
    | Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    | undefined = HUNG.get(body);
  if (known !== undefined) return known;
  const fingers: Record<AutoMovieHumanSide, ReturnType<typeof HumanHand.shape>> = {
    left: HumanHand.shape("left", "relaxed"),
    right: HumanHand.shape("right", "relaxed"),
  };
  const prepared: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  let standing: IAutoMovieMotionHumanPosture | undefined;
  const hanging: (
    abduction: number,
  ) => Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = (
    abduction: number,
  ): Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > => {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    for (const side of ["left", "right"] as const) {
      Object.assign(out, fingers[side]);
      out[`${side}UpperArm`] = [0, abduction, 0];
      out[`${side}LowerArm`] = [stand.ELBOW, 0, 0];
    }
    return out;
  };

  // The stance is resolved once. A candidate differs from it in the two
  // upper arms' direct angles alone: assembly clamps each direct joint on
  // its own, the stance's leg fits read no arm, and it asks no arm or digit
  // goal, so the pose of another candidate is the first one's with those two
  // records clamped anew. The bones an upper arm carries are then the only
  // frames and colliders that move; the rest of the body is placed once.
  const clampJoint: ReturnType<typeof prepareHumanPostureProjection.joints> =
    prepareHumanPostureProjection.joints(body, projection);
  let first:
    | { pose: IAutoMoviePose; still: readonly IAutoMovieMotionHumanColliders.IPlaced[] }
    | undefined;
  let carried: ReadonlySet<AutoMovieHumanoidBone> | undefined;
  let clearance: ReturnType<typeof HumanDigitFit.hanging>;
  const shoulders: Set<AutoMovieHumanoidBone> = new Set(["leftUpperArm", "rightUpperArm"]);
  let placeCarried:
    | ReturnType<typeof HumanColliders.preparePlaced>
    | undefined;
  const shape: (
    resolved: IAutoMoviePose,
    joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >,
  ) => IAutoMoviePose = (
    resolved: IAutoMoviePose,
    joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >,
  ): IAutoMoviePose => ({
    ...resolved,
    joints: resolved.joints.map(
      (j: IAutoMovieJointPose): IAutoMovieJointPose => {
        const a: readonly [number, number, number] | undefined = joints[j.bone];
        return a === undefined || !DIGIT.test(j.bone)
          ? j
          : { bone: j.bone, flexion: a[0], abduction: a[1], twist: a[2] };
      },
    ),
  });

  // Read the stated shape before the posture resolver's digit clearing.
  const sinks: (abduction: number) => boolean = (
    abduction: number,
  ): boolean => {
    standing ??= stand.stance(body, { x: 0, y: 0, z: 0 }, 0, {});
    if (first !== undefined && carried !== undefined && placeCarried !== undefined) {
      const turned: IAutoMoviePose = {
        ...first.pose,
        joints: first.pose.joints.map(
          (j: IAutoMovieJointPose): IAutoMovieJointPose =>
            j.bone === "leftUpperArm" || j.bone === "rightUpperArm"
              ? clampJoint!({ bone: j.bone, flexion: 0, abduction, twist: 0 })
              : j,
        ),
      };
      const moved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, turned, prepared(), carried);
      const arms: IAutoMovieMotionHumanColliders.IPlaced[] =
        placeCarried(moved);
      if (armSinks(body, [...first.still, ...arms])) return true;
      if (clearance !== undefined) {
        const status: boolean | undefined = clearance(poseBones(body, turned, prepared(), shoulders));
        if (status !== undefined) return status;
      }
      return HumanDigitFit.penetrates(body, moved, [...first.still, ...arms]);
    }
    const joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = hanging(abduction);
    const posture: IAutoMovieMotionHumanPosture = {
      ...standing,
      joints: { ...joints, ...standing.joints },
    };
    const resolved: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      prepared,
      undefined,
      projection,
    ).pose;
    const shaped: IAutoMoviePose = shape(resolved, joints);
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, shaped, prepared());

    // Only a stance that leaves the arms to their direct angles is one pose
    // with two records varying; any other keeps the whole resolve a candidate.
    if (
      clampJoint !== undefined &&
      standing.digits === undefined &&
      standing.limbs.leftArm === undefined &&
      standing.limbs.rightArm === undefined &&
      standing.joints.leftUpperArm === undefined &&
      standing.joints.rightUpperArm === undefined
    ) {
      carried = below(body, ["leftUpperArm", "rightUpperArm"]);
      const fixed: Set<AutoMovieHumanoidBone> = new Set();
      for (const bone of HumanColliders.bones(body))
        if (!carried.has(bone)) fixed.add(bone);
      placeCarried = HumanColliders.preparePlaced(body, carried);
      first = {
        pose: shaped,
        still: HumanColliders.preparePlaced(body, fixed)(bones),
      };
      const placed: IAutoMovieMotionHumanColliders.IPlaced[] = [...first.still, ...placeCarried(bones)];
      clearance = HumanDigitFit.hanging(body, bones, placed, below(body, ["leftUpperArm"]), below(body, ["rightUpperArm"]));
      return (
        armSinks(body, placed) || HumanDigitFit.penetrates(body, bones, placed)
      );
    }
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    return (
      armSinks(body, placed) || HumanDigitFit.penetrates(body, bones, placed)
    );
  };
  const range: IAutoMovieAngleRange | null | undefined = getConstraint(
    "leftUpperArm",
    readHumanBone(body, "leftUpperArm")?.constraint ?? null,
  )?.abduction;
  if (range === null || range === undefined)
    throw new Error("The shoulder has no abduction range to hang the arm in");
  let lo: number = 0;
  let hi: number = range.max;
  if (sinks(lo))
    while (hi - lo > ROM_TOLERANCE) {
      const mid: number = (lo + hi) / 2;
      if (sinks(mid)) lo = mid;
      else hi = mid;
    }
  else hi = lo;
  const out: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = hanging(hi);
  HUNG.set(body, out);
  return out;
}

/** Each body's relaxed hanging arms, solved once. */
const HUNG: WeakMap<
  IAutoMovieMotionHumanBody,
  Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
> = new WeakMap();

/** The given bones and every bone the rig hangs below them. */
function below(
  body: IAutoMovieMotionHumanBody,
  roots: readonly AutoMovieHumanoidBone[],
): Set<AutoMovieHumanoidBone> {
  const parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> =
    new Map();
  for (const bone of body.skeleton.bones) parents.set(bone.bone, bone.parent);
  const out: Set<AutoMovieHumanoidBone> = new Set();
  for (const bone of body.skeleton.bones)
    for (
      let at: AutoMovieHumanoidBone | null | undefined = bone.bone;
      at !== null && at !== undefined;
      at = parents.get(at)
    )
      if (roots.includes(at)) {
        out.add(bone.bone);
        break;
      }
  return out;
}

/**
 * Whether an upper arm, forearm or palm enters a collider of the body
 * outside its own arm, other than a pair the profile declares overlapping at
 * a pivot. The digits are `HumanDigitFit`'s.
 */
function armSinks(
  body: IAutoMovieMotionHumanBody,
  placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
): boolean {
  for (const side of ["left", "right"] as const) {
    const own: Set<AutoMovieHumanoidBone> = below(body, [`${side}UpperArm`]);
    for (const limb of placed) {
      if (!own.has(limb.bone) || DIGIT.test(limb.bone)) continue;
      for (const other of placed) {
        if (
          own.has(other.bone) ||
          isPhysicalProfilePairExcluded(body.profile, limb.bone, other.bone)
        )
          continue;
        for (const a of limb.shapes)
          for (const b of other.shapes)
            if (physicalShapePairDistance(limb.pose, a, other.pose, b) < 0)
              return true;
      }
    }
  }
  return false;
}

/** A digit's bone. */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/;

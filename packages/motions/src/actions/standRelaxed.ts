import { ROM_TOLERANCE, getConstraint } from "@automovie/engine";
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

/** The record of `IStandRelaxedFirst`'s site. */
type IStandRelaxedFirst = {
  pose: IAutoMoviePose;
  still: readonly IAutoMovieMotionHumanColliders.IPlaced[];
};

/**
 * The relaxed hanging arms of a body, the body's own quiet-stance property
 * (`IAutoMovieMotionHumanBody.relaxed`), solved once by its record.
 *
 * @param body The body.
 * @returns The two arms' and hands' clinical angles.
 */
export function standRelaxed(
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanBody["relaxed"] {
  return body.relaxed;
}

/**
 * The relaxed arm's least shoulder abduction that leaves its digits clear of
 * the body in a quiet stance, solved for the body's record.
 */
export namespace standRelaxed {
  /**
   * Solve the relaxed hanging arms. The elbow stays at the standing law's
   * `stand.ELBOW` and the digits in the relaxed shape; wider bodies need wider
   * hanging arms. The depth is measured before any digit clearing changes that
   * shape. Bisection ends at the engine's joint-angle resolution. The body's
   * record reads it once, on its first use (`createHumanBody`).
   *
   * @param body The body.
   * @returns The two arms' and hands' clinical angles.
   * @throws {Error} When the shoulder has no abduction range.
   */
  export function solve(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanBody["relaxed"] {
    const fingers: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanHand.shape>
    > = {
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
    let first: IStandRelaxedFirst | undefined;
    let carried: ReadonlySet<AutoMovieHumanoidBone> | undefined;
    let clearance: ReturnType<typeof HumanDigitFit.hanging>;
    const shoulders: Set<AutoMovieHumanoidBone> = new Set([
      "leftUpperArm",
      "rightUpperArm",
    ]);
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
          const a: readonly [number, number, number] | undefined =
            joints[j.bone];
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
      if (
        first !== undefined &&
        carried !== undefined &&
        placeCarried !== undefined
      ) {
        const turned: IAutoMoviePose = {
          ...first.pose,
          joints: first.pose.joints.map(
            (j: IAutoMovieJointPose): IAutoMovieJointPose =>
              j.bone === "leftUpperArm" || j.bone === "rightUpperArm"
                ? clampJoint!({ bone: j.bone, flexion: 0, abduction, twist: 0 })
                : j,
          ),
        };
        if (clearance !== undefined) {
          const status: boolean | undefined = clearance(
            poseBones(body, turned, prepared(), shoulders),
          );
          if (status !== undefined) return status;
        }
        const moved: ReadonlyMap<
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone
        > = poseBones(body, turned, prepared(), carried);
        return HumanDigitFit.penetrates(body, moved, [
          ...first.still,
          ...placeCarried(moved),
        ]);
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
        const placed: IAutoMovieMotionHumanColliders.IPlaced[] = [
          ...first.still,
          ...placeCarried(bones),
        ];
        clearance = HumanDigitFit.hanging(
          body,
          bones,
          placed,
          below(body, ["leftUpperArm"]),
          below(body, ["rightUpperArm"]),
        );
        return HumanDigitFit.penetrates(body, bones, placed);
      }
      return HumanDigitFit.penetrates(body, bones);
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
    return hanging(hi);
  }
}

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

/** A digit's bone. */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/;

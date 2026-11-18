import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { StrikingBody } from "../striking/StrikingBody";
import { supportContact } from "./supportContact";

/** The blended posture's achieved pin and its clear floor height. */
interface IPinFloor {
  /** Achieved pin of the unshifted direct posture, world metres. */
  point: IAutoMovieVector3;

  /** The smallest world root height keeping the direct colliders above the floor, metres. */
  floor: number;
}

/**
 * Read the pin and floor of a support interval's direct joint blend together.
 *
 * @param body The unchanged body and collider profile.
 * @param contact The contact pinned by the interval's root.
 * @param at The material contact's captured target or unnamed floor place, world metres.
 * @returns A reader of the blend's exact pin and floor from the same forward kinematics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed material geometry and the varying blend, pin and floor frames.
 * @evidence contracts/development/implementation.md#principled-implementation A direct joint blend and its root-translated version have identical rotation and root-relative collider heights. Read the original pin datum and both demands at zero Y, then restore Y only for the contact point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The material datum, union bone demand and minimum reader prepare first. Each sample poses once, transforms the pin and reduces the floor.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The input is the direct blend before any planted limb goals. The same collider minimum and exact contact datum are used, and the subsequent held-leg confirmation still measures the actual fitted limbs.
 * @evidence contracts/development/implementation.md#efficient-algorithms The exact pin-demand FK and direct floor FK share one ROM admission and demand-union FK per moving sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the fixed material datum and skeleton demand carry between reads. Pose data is used within the current evaluation only.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fixed contact and collider geometry release with the interval. No output, pose workspace or motion history is retained.
 */
export function prepareSupportPinFloor(
  body: IAutoMovieMotionHumanBody,
  contact: IAutoMovieMotionHumanSupport.IContact,
  at: IAutoMovieVector3 | null,
): (
  posture: IAutoMovieMotionHumanPosture,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
) => IPinFloor {
  const target: IAutoMovieMotionHumanBodyFitTypes.ITarget =
    supportContact.prepareForm(body, false)(contact, at).target;
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    ...HumanColliders.bones(body),
    target.bone,
  ]);
  const posed: ReturnType<typeof StrikingBody.prepareTrunk> =
    StrikingBody.prepareTrunk(body, requested);
  const minima: ReturnType<typeof HumanColliders.prepareMinima> =
    HumanColliders.prepareMinima(body);
  const offset: IAutoMovieVector3 = target.point ?? { x: 0, y: 0, z: 0 };
  return (
    posture: IAutoMovieMotionHumanPosture,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: ReturnType<typeof prepareHumanPostureProjection>,
  ): IPinFloor => {
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      posed(
        {
          ...posture,
          root: { ...posture.root, y: 0 },
        },
        resolution,
        projection,
      );
    const bone: IAutoMovieResolvedBone = bones.get(target.bone)!;
    const point: IAutoMovieVector3 = Vector3.add(
      bone.worldPosition,
      Quaternion.rotateVector(bone.worldRotation, offset),
    );
    return {
      point: { ...point, y: point.y + posture.root.y },
      floor: -minima(bones)[0]!,
    };
  };
}

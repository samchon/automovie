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

import { HumanColliders } from "../../posture/internal/HumanColliders";
import type { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { supportContact } from "./supportContact";

/*
 * Read the pin and floor of a support interval's direct joint blend together.
 * Parameter body: The unchanged body and collider profile.
 * Parameter contact: The contact pinned by the interval's root.
 * Parameter at: The material contact's captured target or unnamed floor place,
 * world metres.
 * Returns: A reader of the blend's exact pin and floor from the same forward
 * kinematics.
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

/*
 * The blended posture's achieved pin and its clear floor height.
 */
interface IPinFloor {
  /*
   * Achieved pin of the unshifted direct posture, world metres.
   */
  point: IAutoMovieVector3;

  /*
   * The smallest world root height keeping the direct colliders above the
   * floor, metres.
   */
  floor: number;
}

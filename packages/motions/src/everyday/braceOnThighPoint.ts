import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";

/**
 * Where a palm braces on its own thigh just above the knee, the hand
 * support of a low posture (Kingma, Faber and van Dieen 2016, J Biomech
 * 49:881, on supporting the trunk with a hand on the thigh "just above the
 * knee"), read on the solved leg: the palm's centre half the body's own
 * hand length above the knee on the thigh's front, so the heel of the hand
 * rests just above the kneecap and the fingers reach toward it; the outward
 * normal there, and the thigh's direction toward the knee the fingers lie
 * along.
 *
 * @param body The body, for its thigh regions.
 * @param side The thigh.
 * @param bones The solved bones; the side's upper and lower leg are read.
 * @returns The point and normal, world metres and a unit vector, and the fingers' direction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the support and its source, the place along the thigh, the frame and units of the result and the bones read.
 * @evidence contracts/development/implementation.md#principled-implementation The region is placed on the solved thigh bone, its offset from the bone's axis carried from the thigh's middle to the knee joint so it stays on the thigh's front, then moved up the thigh by half the hand's length, where a palm centred there ends at the knee; the normal is the region's, rotated with the bone.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One point, one normal and one direction from two bones, shared by the bend law's free hand and the `braceOnThigh` primitive of the crouch and the kneel.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The place is read from the body's own hand length and leg; no body is special-cased.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant vector work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh vectors and retains nothing.
 */
export function braceOnThighPoint(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): { point: IAutoMovieVector3; normal: IAutoMovieVector3; forward: IAutoMovieVector3 } {
  const region: IAutoMovieMotionHumanBody["surfaces"]["regions"]["thighFrontLeft"] =
    body.surfaces.regions[side === "left" ? "thighFrontLeft" : "thighFrontRight"];
  const thigh: IAutoMovieResolvedBone = bones.get(`${side}UpperLeg`)!;
  const knee: IAutoMovieVector3 = bones.get(`${side}LowerLeg`)!.worldPosition;
  const onThigh: IAutoMovieVector3 = Vector3.add(
    thigh.worldPosition,
    Quaternion.rotateVector(thigh.worldRotation, region.point),
  );

  // The thigh's front over the knee: the region's offset from the thigh's
  // axis, carried from the thigh's middle down to the knee joint.
  const front: IAutoMovieVector3 = Vector3.add(
    knee,
    Vector3.subtract(onThigh, Vector3.lerp(thigh.worldPosition, knee, 0.5)),
  );
  const along: IAutoMovieVector3 = Vector3.subtract(knee, thigh.worldPosition);
  const axis: IAutoMovieVector3 = Vector3.normalize(along);

  // Half a hand above the knee, or as far up the thigh's front as the
  // relaxed arm reaches when that is higher (an upright kneeling thigh,
  // whose knee is on the floor): the nearer root s of
  // |front - s axis - shoulder| = reach, the shoulder-to-palm length of the
  // arm at the body's relaxed elbow flexion (law of cosines over the upper
  // arm and the forearm), so the arm is not asked onto its straight end.
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const palm: IAutoMovieVector3 =
    body.surfaces.sockets[side === "left" ? "palmLeft" : "palmRight"].point;
  const elbow: number =
    ((stand.relaxed(body)[`${side}LowerArm`]?.[0] ?? 0) * Math.PI) / 180;
  const reach: number =
    Math.sqrt(
      m.upperArm * m.upperArm +
        m.forearm * m.forearm +
        2 * m.upperArm * m.forearm * Math.cos(elbow),
    ) + Vector3.length(palm);
  const d: IAutoMovieVector3 = Vector3.subtract(
    front,
    bones.get(`${side}UpperArm`)!.worldPosition,
  );
  const b: number = Vector3.dot(axis, d);
  const disc: number = b * b - Vector3.dot(d, d) + reach * reach;
  const up: number = Math.max(
    m.hand / 2,
    disc >= 0 ? b - Math.sqrt(disc) : m.hand / 2,
  );
  return {
    point: Vector3.addScaled(front, axis, -up),
    normal: Quaternion.rotateVector(thigh.worldRotation, region.normal),
    forward: along,
  };
}

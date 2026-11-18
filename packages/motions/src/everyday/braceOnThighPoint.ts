import { Quaternion, Vector3, bracketedBisection } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { handReach } from "./handReach";

/** The palm site and its orientation in the actual thigh's frame. */
interface IBrace {
  /** World metres, out from the collider by the hand's contact depth. */
  point: IAutoMovieVector3;

  /** The outward world normal of the thigh region. */
  normal: IAutoMovieVector3;

  /** Rotation seating the open palm along this thigh. */
  rotation: IAutoMovieQuaternion;
}

/** The bones displayed by a single braced posture. */
type IRead = (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>) => IBrace;

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
 * @returns A reader of the resolved thigh, knee and shoulder bones. The result gives the clearance-adjusted palm site, normal and knee direction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the support and its source, the place along the thigh, the frame and units of the result and the bones read.
 * @evidence contracts/development/implementation.md#principled-implementation The nearer reachable point along the thigh from above the knee is projected onto the thigh collider. The hand is placed one depth of its colliders out along the normal to keep the open thumb from interpenetrating.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the hand's fixed normal depth and eased reach. Read each actual thigh, knee and shoulder to place its contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The place and clearance come from the rig's own hand and leg colliders. The surface region supplies the geometric fallback where its collider has no ray hit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads hand geometry once and projects each changing contact on one placed thigh collider.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed palm's depth, eased reach, region and padding follow the body, not the posture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller retains body and scalar contact geometry for the plan. Each pose read returns fresh vectors and releases its current frames.
 */
export function braceOnThighPoint(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): IRead {
  const region: IAutoMovieMotionHumanBody["surfaces"]["regions"]["thighFrontLeft"] =
    body.surfaces.regions[side === "left" ? "thighFrontLeft" : "thighFrontRight"];
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(body, side, "palm", "flat");
  const elbow: number =
    ((stand.relaxed(body)[`${side}LowerArm`]?.[0] ?? 0) * Math.PI) / 180;
  const reach: number =
    Math.sqrt(
      m.upperArm * m.upperArm +
        m.forearm * m.forearm +
        2 * m.upperArm * m.forearm * Math.cos(elbow),
    );
  const neutral: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0, joints: {}, limbs: {},
  };
  const depth: number = Math.max(0, handReach(body, neutral, side, Quaternion.identity(), "palm", "flat")(palm.normal));
  return (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): IBrace => {
    const thigh: IAutoMovieResolvedBone = bones.get(`${side}UpperLeg`)!;
    const knee: IAutoMovieVector3 = bones.get(`${side}LowerLeg`)!.worldPosition;
    const onThigh: IAutoMovieVector3 = Vector3.add(
      thigh.worldPosition,
      Quaternion.rotateVector(thigh.worldRotation, region.point),
    );

    // Carry the region's offset from the thigh axis down to the knee.
    const front: IAutoMovieVector3 = Vector3.add(
      knee,
      Vector3.subtract(onThigh, Vector3.lerp(thigh.worldPosition, knee, 0.5)),
    );
    const along: IAutoMovieVector3 = Vector3.subtract(knee, thigh.worldPosition);
    const axis: IAutoMovieVector3 = Vector3.normalize(along);
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(thigh.worldRotation, region.normal);
    const rotation: IAutoMovieQuaternion = HumanHand.align(palm, { normal: Vector3.scale(normal, -1), forward: along });
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      Vector3.addScaled(front, normal, depth), Quaternion.rotateVector(rotation, palm.point),
    );

    // The nearer intersection with the shoulder-to-palm reach sphere
    // raises the site on an upright kneeling thigh.
    const d: IAutoMovieVector3 = Vector3.subtract(wrist, bones.get(`${side}UpperArm`)!.worldPosition);
    const b: number = Vector3.dot(axis, d);
    const disc: number = b * b - Vector3.dot(d, d) + reach * reach;
    const up: number = Math.max(m.hand / 2, disc >= 0 ? b - Math.sqrt(disc) : m.hand / 2);
    const only: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([[region.bone, thigh]]);
    const span: number = m.thigh + m.hand;
    const padded = (height: number): IAutoMovieVector3 => {
      const geometric = Vector3.addScaled(front, axis, -height);
      const skin = HumanColliders.cast(body, only, Vector3.addScaled(geometric, normal, span), Vector3.scale(normal, -1), 2 * span)?.point ?? geometric;
      return Vector3.addScaled(skin, normal, depth);
    };
    const shoulder = bones.get(`${side}UpperArm`)!.worldPosition;
    const offset = Quaternion.rotateVector(rotation, palm.point);
    const missed = (point: IAutoMovieVector3): boolean =>
      Vector3.distance(Vector3.subtract(point, offset), shoulder) > reach;
    let point = padded(up);
    // Curvature changes the true skin from the plane's predicted position.
    // Only this near-limit case refines the shoulder's intersection with it.
    const top = Math.max(up, Vector3.length(along) - m.hand / 2);
    if (top > up && missed(point) && !missed(padded(top)))
      point = padded(bracketedBisection(
        (height: number): boolean => missed(padded(height)),
        up, top, SITE_RESOLUTION,
      ));
    return { point, normal, rotation };
  };
}

/** A tenth of a millimetre resolves the surface intersection below skin tolerance. */
const SITE_RESOLUTION: number = 1e-4;
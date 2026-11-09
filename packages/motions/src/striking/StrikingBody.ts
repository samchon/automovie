import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { StrikingContact } from "./StrikingContact";

/**
 * The body facts striking laws read: where a posture puts the shoulders,
 * hips and head before any limb is solved, where a weapon socket sits
 * relative to its wrist or ankle under a hand or foot rotation, the closed
 * fist's finger angles, and another body's limbs as capsules for the contact
 * sweep.
 *
 * Bone-local socket and region frames are read as the engine resolves them
 * on the canonical rig, whose rest rotations are the identity (the VRM
 * normalized T-pose), so a hand or foot posed by a world rotation `G` from its
 * rest carries a socket point `p` to `wrist + G p` (the convention
 * `HumanFoot` uses for the sole).
 */
export namespace StrikingBody {
  /**
   * World bones of a posture's trunk: the posture without its limb goals,
   * so the shoulders and hips are where the root, the heading and the trunk
   * joints put them, the points every limb solve starts from.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Resolved bones by rig bone.
   */
  export function trunk(body: IHumanBody, posture: IHumanPosture): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const pose = resolveHumanPosture(body, { ...posture, limbs: {} });
    return new Map(
      resolvePose(pose, body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
        (r: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
  }

  /**
   * A region of a body at its resolved bones.
   *
   * @param body The body.
   * @param bones Its resolved bones.
   * @param region The region.
   * @returns World point and outward normal.
   */
  export function region(
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    region: AutoMovieHumanoidRegion,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const frame: resolveAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions[region];
    return resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!);
  }

  /**
   * A hand or foot socket's offset from its wrist or ankle under a world
   * rotation of that hand or foot.
   *
   * @param body The body.
   * @param socket The socket.
   * @param rotation The hand's or foot's world rotation from its rest.
   * @returns The offset, world metres.
   */
  export function socket(body: IHumanBody, socket: AutoMovieHumanoidSocket, rotation: IAutoMovieQuaternion): IAutoMovieVector3 {
    return Quaternion.rotateVector(rotation, body.surfaces.sockets[socket].point);
  }

  /**
   * The hand's world rotation that points the fist along a direction with
   * the palm facing a second direction: the rest finger axis (from the wrist
   * to the middle knuckle, along the arm in the T-pose) onto `knuckles` and the
   * rest palm normal (down) toward `palm`.
   *
   * @param body The body.
   * @param side The hand.
   * @param knuckles Where the fist's front faces, world direction.
   * @param palm Where the palm faces, world direction (not parallel to `knuckles`).
   * @returns The rotation.
   */
  export function fist(body: IHumanBody, side: "left" | "right", knuckles: IAutoMovieVector3, palm: IAutoMovieVector3): IAutoMovieQuaternion {
    const fingers: IAutoMovieVector3 = Vector3.subtract(body.rest.get(`${side}MiddleProximal`)!, body.rest.get(`${side}Hand`)!);
    return HumanHand.align({ normal: fingers, forward: { x: 0, y: -1, z: 0 } }, { normal: knuckles, forward: palm });
  }

  /**
   * The foot's world rotation that points the toes along a direction with
   * the top of the foot (the instep) facing a second direction: the rest toe
   * axis (+Z) onto `toes`, the rest instep normal (+Y) toward `instep`.
   *
   * @param toes Where the toes point, world direction.
   * @param instep Where the instep faces, world direction (not parallel to `toes`).
   * @returns The rotation.
   */
  export function foot(toes: IAutoMovieVector3, instep: IAutoMovieVector3): IAutoMovieQuaternion {
    return HumanHand.align({ normal: { x: 0, y: 0, z: 1 }, forward: { x: 0, y: 1, z: 0 } }, { normal: toes, forward: instep });
  }

  /**
   * The closed fist's finger and thumb angles, clinical degrees: the
   * metacarpophalangeal, proximal and distal interphalangeal joints at 85,
   * 100 and 70 degrees, inside their normal 90, 100 and 80 degree ranges
   * (American Academy of Orthopaedic Surgeons, Joint Motion, 1965), with the
   * thumb folded 40 degrees across the middle phalanges. A finger curl has no
   * effector goal the limb solver could express, so it is set as angles.
   *
   * @param side The hand.
   * @returns Clinical angles by bone.
   */
  export function curl(side: "left" | "right"): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const out: Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> = {};
    for (const digit of ["Index", "Middle", "Ring", "Little"]) {
      out[`${side}${digit}Proximal` as AutoMovieHumanoidBone] = [85, 0, 0];
      out[`${side}${digit}Intermediate` as AutoMovieHumanoidBone] = [100, 0, 0];
      out[`${side}${digit}Distal` as AutoMovieHumanoidBone] = [70, 0, 0];
    }
    out[`${side}ThumbProximal` as AutoMovieHumanoidBone] = [40, 0, 0];
    out[`${side}ThumbDistal` as AutoMovieHumanoidBone] = [40, 0, 0];
    return out;
  }

  /**
   * Another body's collision shapes posed by its bones: every shape of every
   * physical-profile segment (the same shapes its regions are resolved on),
   * carried from the segment's neutral frame by its bone's world placement.
   * With the canonical rig's identity rest rotations, a shape's bone-local
   * offset `R_n p_s` (neutral rotation applied to the shape's position) is
   * rotated by the bone's world rotation and added to its world position.
   *
   * @param body The other body.
   * @param bones Its resolved bones.
   * @returns The colliders, named by bone.
   */
  export function colliders(body: IHumanBody, bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): StrikingContact.ICollider[] {
    const out: StrikingContact.ICollider[] = [];
    for (const segment of body.profile.segments) {
      const bone: IAutoMovieResolvedBone | undefined = bones.get(segment.bone as AutoMovieHumanoidBone);
      if (bone === undefined) continue;
      for (const shape of segment.shapes) {
        const rotation: IAutoMovieQuaternion = Quaternion.multiply(bone.worldRotation, Quaternion.multiply(segment.neutral.rotation, shape.transform.rotation));
        const centre: IAutoMovieVector3 = Vector3.add(
          bone.worldPosition,
          Quaternion.rotateVector(bone.worldRotation, Quaternion.rotateVector(segment.neutral.rotation, shape.transform.position)),
        );
        if (shape.kind === "box") out.push({ kind: "box", name: segment.bone, centre, rotation, halfExtents: shape.halfExtents });
        else {
          const half: number = shape.kind === "capsule" ? shape.halfLength : 0;
          const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 0, y: half, z: 0 });
          out.push({ kind: "capsule", name: segment.bone, a: Vector3.subtract(centre, axis), b: Vector3.add(centre, axis), radius: shape.radius });
        }
      }
    }
    return out;
  }
}

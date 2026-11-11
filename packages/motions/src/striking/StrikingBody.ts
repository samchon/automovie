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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each fact is for and the identity-rest premise the socket convention rests on.
 * @evidence contracts/development/design.md#principled-representation A namespace of pure functions over the body, its resolved bones and world rotations, in world metres and clinical degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The trunk, region, socket, fist, foot, curl and collider readings the striking laws, the reactions and the captures use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's surface resolver and the interface's region and socket unions; the collider list overlaps the posture package's HumanColliders, which owns the signed distances, and is kept only as the shape list the floor rest reads.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is dropped and why the result is the limb solves' start.
   * @evidence contracts/development/implementation.md#principled-implementation The posture resolved with no limb goals, then forward kinematics with the canonical axes and rest frames.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolution and one map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function trunk(
    body: IHumanBody,
    posture: IHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const pose = resolveHumanPosture(body, { ...posture, limbs: {} });
    return new Map(
      resolvePose(
        pose,
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
  }

  /**
   * A region of a body at its resolved bones.
   *
   * @param body The body.
   * @param bones Its resolved bones.
   * @param region The region.
   * @param tangent A point of the region's surface beside its own point, as an offset on its tangent plane; absent or zero, the region's own point.
   * @returns World point and outward normal.
   * @throws {Error} When an offset is asked of a region the engine does not place by a ray.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's frame and what the offset selects.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's bone-local region frame, or its surface point at the offset, placed by its bone's world transform.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time at the region's own point; one rest pose and one ray at an offset.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; a strike reads its offset point a few times per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function region(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    region: AutoMovieHumanoidRegion,
    tangent?: resolveAutoMovieHumanoidSurfaces.ITangent,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const frame: resolveAutoMovieHumanoidSurfaces.IFrame =
      tangent === undefined || (tangent.up === 0 && tangent.out === 0)
        ? body.surfaces.regions[region]
        : resolveAutoMovieHumanoidSurfaces.offset(
            body.skeleton,
            body.profile,
            region,
            tangent,
          );
    const placed = resolveAutoMovieHumanoidSurfaces.place(
      frame,
      bones.get(frame.bone)!,
    );
    return { point: placed.point, normal: placed.normal };
  }

  /**
   * A region's radius: half the distance from its point to the nearest other
   * region's point at rest, so every point within it is nearer to this
   * region than to any other.
   *
   * @param body The body.
   * @param region The region.
   * @returns The radius, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the definition and the property it gives.
   * @evidence contracts/development/implementation.md#principled-implementation Half the nearest-neighbour distance is the largest ball about a point in which that point is the nearest of the set.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the regions at rest.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read from the body's own regions, with no radius typed per region.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the regions.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the body; a strike reads it once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function radius(
    body: IHumanBody,
    region: AutoMovieHumanoidRegion,
  ): number {
    const at = (name: AutoMovieHumanoidRegion): IAutoMovieVector3 => {
      const frame: resolveAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[name];
      return Vector3.add(body.rest.get(frame.bone)!, frame.point);
    };
    const own: IAutoMovieVector3 = at(region);
    let nearest: number = Infinity;
    for (const name of Object.keys(
      body.surfaces.regions,
    ) as AutoMovieHumanoidRegion[])
      if (name !== region)
        nearest = Math.min(
          nearest,
          Vector3.length(Vector3.subtract(at(name), own)),
        );
    return 0.5 * nearest;
  }

  /**
   * A hand or foot socket's offset from its wrist or ankle under a world
   * rotation of that hand or foot.
   *
   * @param body The body.
   * @param socket The socket.
   * @param rotation The hand's or foot's world rotation from its rest.
   * @returns The offset, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rotation's meaning and the result's frame.
   * @evidence contracts/development/implementation.md#principled-implementation The bone-local socket point rotated by the world rotation, valid because the canonical rig rests unrotated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function socket(
    body: IHumanBody,
    socket: AutoMovieHumanoidSocket,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      rotation,
      body.surfaces.sockets[socket].point,
    );
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rest axes mapped and the non-parallel premise.
   * @evidence contracts/development/implementation.md#principled-implementation The hand's two-axis frame alignment from the rest finger axis and palm normal onto the requested ones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rest-axis read and one alignment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function fist(
    body: IHumanBody,
    side: "left" | "right",
    knuckles: IAutoMovieVector3,
    palm: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    const fingers: IAutoMovieVector3 = Vector3.subtract(
      body.rest.get(`${side}MiddleProximal`)!,
      body.rest.get(`${side}Hand`)!,
    );
    return HumanHand.align(
      { normal: fingers, forward: { x: 0, y: -1, z: 0 } },
      { normal: knuckles, forward: palm },
    );
  }

  /**
   * The foot's world rotation that points the toes along a direction with
   * the top of the foot (the instep) facing a second direction: the rest toe
   * axis (+Z) onto `toes`, the rest instep normal (+Y) toward `instep`.
   *
   * @param toes Where the toes point, world direction.
   * @param instep Where the instep faces, world direction (not parallel to `toes`).
   * @returns The rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rest axes mapped and the non-parallel premise.
   * @evidence contracts/development/implementation.md#principled-implementation The same two-axis frame alignment from the rest toe axis and instep normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One alignment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function foot(
    toes: IAutoMovieVector3,
    instep: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    return HumanHand.align(
      { normal: { x: 0, y: 0, z: 1 }, forward: { x: 0, y: 1, z: 0 } },
      { normal: toes, forward: instep },
    );
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each joint's angle, its source range and why angles are used.
   * @evidence contracts/development/implementation.md#principled-implementation Fixed clinical flexions inside the AAOS normal ranges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the four fingers and the thumb's two joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function curl(
    side: "left" | "right",
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which shapes, how they are placed and the identity-rest premise.
   * @evidence contracts/development/implementation.md#principled-implementation Each profile shape's bone-local offset rotated by its bone's world rotation; this reads the segment's neutral frame at its bone's rest joint, true of the canonical profiles, where HumanColliders also subtracts the neutral position's offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over segments and shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in shapes.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function colliders(
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): StrikingContact.ICollider[] {
    const out: StrikingContact.ICollider[] = [];
    for (const segment of body.profile.segments) {
      const bone: IAutoMovieResolvedBone | undefined = bones.get(
        segment.bone as AutoMovieHumanoidBone,
      );
      if (bone === undefined) continue;
      for (const shape of segment.shapes) {
        const rotation: IAutoMovieQuaternion = Quaternion.multiply(
          bone.worldRotation,
          Quaternion.multiply(
            segment.neutral.rotation,
            shape.transform.rotation,
          ),
        );
        const centre: IAutoMovieVector3 = Vector3.add(
          bone.worldPosition,
          Quaternion.rotateVector(
            bone.worldRotation,
            Quaternion.rotateVector(
              segment.neutral.rotation,
              shape.transform.position,
            ),
          ),
        );
        if (shape.kind === "box")
          out.push({
            kind: "box",
            name: segment.bone,
            centre,
            rotation,
            halfExtents: shape.halfExtents,
          });
        else {
          const half: number = shape.kind === "capsule" ? shape.halfLength : 0;
          const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
            x: 0,
            y: half,
            z: 0,
          });
          out.push({
            kind: "capsule",
            name: segment.bone,
            a: Vector3.subtract(centre, axis),
            b: Vector3.add(centre, axis),
            radius: shape.radius,
          });
        }
      }
    }
    return out;
  }
}

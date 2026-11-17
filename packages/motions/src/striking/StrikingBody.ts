import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The actual trunk and fixed-demand trunk producer, region/socket/hand/foot geometry and collider readings serve striking, reactions and captures; canonical pose/FK preparation remains with its existing owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's surface resolver and the interface's region and socket unions; the collider list overlaps the posture package's HumanColliders, which owns the signed distances, and is kept only as the shape list the floor rest reads.
 */
export namespace StrikingBody {
  /**
   * World bones of a posture's trunk: the posture without its limb goals,
   * so the shoulders and hips are where the root, the heading and the trunk
   * joints put them, the points every limb solve starts from.
   *
   * @param body The body with topology indexed from its same, unchanged skeleton.
   * @param posture The posture.
   * @param resolution Optional exact reader or lazy supplier borrowed only within this synchronous evaluation.
   * @param requested Optional output bones whose ancestry is needed; every authored joint is still admitted and clamped.
   * @param projection Optional genuine same-body ROM projector borrowed from this synchronous operation; the posture owner checks provenance and still projects every current joint.
   * @returns Resolved bones by rig bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States dropped limb goals, the result's role as limb-solve input, unchanged-skeleton topology and the optional synchronous borrowed FK workspace.
   * @evidence contracts/development/implementation.md#principled-implementation The posture resolved with no limb goals, then complete forward kinematics with the canonical axes, rest frames and the body's parent-first topology.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture resolution and the canonical poseBones adapter keep mapping, topology and direct Map insertion with their existing owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual posture clamp, digit solve and needed FK ancestor remains; requested output names omit only unused transforms, and the optional reader shares exact scalar prerequisites without a posed-result cache or changed goal policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Posture assembly/clamping still scans rig/joints and retains actual digit searches. Requested final FK admits all joints but computes only demanded ancestry and allocates only requested transforms; omitted demand returns the full map. A parent reader shares only equal scalar prerequisites, and a genuine same-operation projector reuses only fixed ROM metadata while every joint is projected; no measured speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses body topology and, only when supplied, one parent-owned exact FK workspace across actual posture and displayed-frame reads; every posture and authored record still executes normally with fresh output transforms.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns a fresh map/transforms. An optional local getter borrows at most one parent reader only until return or throw; no reader, supplier or posed result enters body memory, a returned plan or persistent state.
   */
  export function trunk(
    body: IHumanBody,
    posture: IHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const read: ReturnType<typeof prepareHumanPoseResolution> | undefined =
      resolution === undefined ? undefined : prepareHumanPoseResolution(resolution);
    const pose: IAutoMoviePose = trunkPose(body, posture, read, projection);
    return poseBones(body, pose, read?.(), requested);
  }

  /**
   * Prepare a fixed genuine bone demand for repeated complete trunk queries.
   * No posed result or FK workspace is retained by the returned producer.
   *
   * @param body The unchanged canonical body and its existing rig producer.
   * @param requested Optional real output demand, snapshotted once; all outputs when absent.
   * @returns A reader of each actual posture, optional synchronous FK source and optional genuine same-body ROM projector, neither retained by the producer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed canonical body/name demand, snapshot behavior, changing posture/source and independent output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation The same trunkPose owner clears only limb goals and executes original seeded assembly/clamping/digit semantics. poseBones.prepare binds the body's genuine requested-name producer once; each current admitted pose still supplies its actual FK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One demand preparation returns one reader; the original one-shot trunk and this repeated-demand path share the exact posture owner, and canonical poseBones retains name/topology/FK ownership.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every current authored joint, root rotation, digit demand and clamp remains. No fabricated indices, caller resolved flag, pose answer, target, seed or query history enters the factory; omitting demand preserves complete FK output.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed K-name sorting/reachable-demand preparation runs once for N queries. Each query retains full authored admission and actual digit work, followed by its original requested FK ancestry and fresh maps/frames; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work An explicit unchanged body and snapshotted real bone set establish demand equivalence. Every changing posture, borrowed FK source and genuine ROM projection loan is used only by its current synchronous invocation. Canonical owners check exact dependencies/provenance and every authored joint is still projected.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one bounded body/demand producer until its action or search ends; it retains neither source set, pose, reader nor answers. Each invocation creates or borrows one local exact workspace released on return or throw, and only its fresh bone map escapes.
   */
  export function prepareTrunk(
    body: IHumanBody,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): (posture: IHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const frames: ReturnType<typeof poseBones.prepare> | undefined =
      requested === undefined ? undefined : poseBones.prepare(body, requested);
    return (posture: IHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
      const pose: IAutoMoviePose = trunkPose(body, posture, read, projection);
      return frames === undefined ? poseBones(body, pose, read()) : frames(pose, read());
    };
  }

  /** The exact original complete admission/digit path with only limb goals cleared. */
  function trunkPose(body: IHumanBody, posture: IHumanPosture, read?: ReturnType<typeof prepareHumanPoseResolution>, projection?: ReturnType<typeof prepareHumanPostureProjection>): IAutoMoviePose {
    return resolveHumanPosture.seeded(body, { ...posture, limbs: {} }, undefined, undefined, read, undefined, projection).pose;
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
   * @evidence contracts/development/implementation.md#principled-implementation The engine's bone-local region frame or exact authored tangent-offset ray is placed on its actual world bone; pointNormal retains the original point and normal math while omitting unconsumed forward.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant point/normal work at the region centre, or the original rest-pose/skin-ray cost at an offset. The canonical pointNormal producer omits unused forward rotation and an extra stripping wrapper; both actual consumed vectors stay fresh and speedup is unmeasured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; a strike reads its offset point a few times per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function region(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    region: AutoMovieHumanoidRegion,
    tangent?: resolveAutoMovieHumanoidSurfaces.ITangent,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const local: resolveAutoMovieHumanoidSurfaces.IFrame = frame(body, region, tangent);
    const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.pointNormal> =
      resolveAutoMovieHumanoidSurfaces.pointNormal(local, bones.get(local.bone)!);
    return placed;
  }

  /**
   * A region's fixed bone-local frame, including an authored tangent offset.
   *
   * @param body The unchanged canonical body supplying the physical skin.
   * @param region The named anatomical region.
   * @param tangent Optional fixed offset on its tangent plane; absent or zero keeps the prepared centre frame.
   * @returns The actual engine frame in its owning bone's coordinates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States bone-local units/frame, canonical-body stability and the central-versus-offset cases.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the prepared anatomical centre frame, or the engine's existing offset ray on the same skeleton/profile for the exact requested tangent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One centre/offset branch owns the choice shared by region placement and fixed-target consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the same region, tangent, skin ray and out-of-domain refusal; no surface tolerance or target point is changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Centre selection is constant work; a nonzero tangent pays the engine's original rest-pose/skin-ray cost once when a fixed-target consumer prepares it. No speedup is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable canonical body contract fixes skeleton/profile and a caller's explicit region/tangent fixes this bone-local frame; consumers may retain that metadata while still placing the actual posed bone at every observation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This function stores no cache; callers borrow the central frame or own the offset result for their geometry's lifetime, without retaining a world pose, observation or FK reader.
   */
  export function frame(
    body: IHumanBody,
    region: AutoMovieHumanoidRegion,
    tangent?: resolveAutoMovieHumanoidSurfaces.ITangent,
  ): resolveAutoMovieHumanoidSurfaces.IFrame {
    return tangent === undefined || (tangent.up === 0 && tangent.out === 0)
        ? body.surfaces.regions[region]
        : resolveAutoMovieHumanoidSurfaces.offset(
            body.skeleton,
            body.profile,
            region,
            tangent,
          );
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
   * @evidence contracts/development/implementation.md#efficient-algorithms The first body/region query retains the original O(R) ordered rest-point scan and exact scalar distance branches; later queries read one fixed radius. No posed point is retained and runtime speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The canonical body producer fixes rest joints and bone-local surface frames after creation, so the actual anatomical rest-space radius depends only on that body and region, never actor pose/time or ROM table values.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak body key owns at most R scalar radii for its valid named regions until body release. Temporary rest points end with the first scan, and no pose, world observation, reader or numerical time history is stored.
   */
  export function radius(
    body: IHumanBody,
    region: AutoMovieHumanoidRegion,
  ): number {
    let radii: Map<AutoMovieHumanoidRegion, number> | undefined = RADII.get(body);
    if (radii === undefined) {
      radii = new Map();
      RADII.set(body, radii);
    }
    const known: number | undefined = radii.get(region);
    if (known !== undefined) return known;
    const at: (name: AutoMovieHumanoidRegion) => IAutoMovieVector3 = (
      name: AutoMovieHumanoidRegion,
    ): IAutoMovieVector3 => {
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
          Vector3.distance(at(name), own),
        );
    const radius: number = 0.5 * nearest;
    radii.set(region, radius);
    return radius;
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
   * each with the posed frame of its segment as `HumanColliders.placed`, the
   * single owner of collider placement, gives it.
   *
   * @param body The other body.
   * @param bones Its resolved bones.
   * @returns The colliders, named by bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which shapes and who places them.
   * @evidence contracts/development/implementation.md#principled-implementation Placement is `HumanColliders.placed`; this function only lists each placed segment's shapes with the segment's pose and bone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over placed segments and shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in shapes.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function colliders(
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): StrikingContact.ICollider[] {
    return HumanColliders.placed(body, bones).flatMap(
      (segment: HumanColliders.IPlaced): StrikingContact.ICollider[] =>
        segment.shapes.map(
          (
            shape: IAutoMoviePhysicalProfile.IShape,
          ): StrikingContact.ICollider => ({
            name: segment.bone,
            pose: segment.pose,
            shape,
          }),
        ),
    );
  }
}

/** Immutable rest/profile geometry only; no posed points or ROM metadata. */
const RADII: WeakMap<IHumanBody, Map<AutoMovieHumanoidRegion, number>> = new WeakMap();

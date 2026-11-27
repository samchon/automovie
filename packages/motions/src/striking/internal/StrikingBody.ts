import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, AutoMovieHumanoidRegion, AutoMovieHumanoidSocket, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanColliders, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanStrikingBody, IAutoMovieMotionHumanStrikingContact, IAutoMoviePhysicalShape, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * The body facts striking laws read: where a posture puts the shoulders, hips
 * and head before any limb is solved, where a weapon socket sits relative to
 * its wrist or ankle under a hand or foot rotation, the closed fist's finger
 * angles, and another body's limbs as capsules for the contact sweep.
 *
 * Bone-local socket and region frames are read as the engine resolves them on
 * the canonical rig, whose rest rotations are the identity (the VRM normalized
 * T-pose), so a hand or foot posed by a world rotation `G` from its rest
 * carries a socket point `p` to `wrist + G p` (the convention `HumanFoot` uses
 * for the sole).
 */
export namespace StrikingBody {
  /*
   * World bones of a posture's trunk: the posture without its limb goals, so
   * the shoulders and hips are where the root, the heading and the trunk joints
   * put them, the points every limb solve starts from.
   * Parameter body: The body with topology indexed from its same, unchanged
   * skeleton.
   * Parameter posture: The posture.
   * Parameter resolution: Optional exact reader or lazy supplier borrowed only
   * within this synchronous evaluation.
   * Parameter requested: Optional output bones whose ancestry is needed; every
   * authored joint is still admitted and clamped.
   * Parameter projection: Optional genuine same-body ROM projector borrowed from
   * this synchronous operation; the posture owner checks provenance and still
   * projects every current joint.
   * Returns: Resolved bones by rig bone.
   */
  export function trunk(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const read: ReturnType<typeof prepareHumanPoseResolution> | undefined =
      resolution === undefined
        ? undefined
        : prepareHumanPoseResolution(resolution);
    const pose: IAutoMoviePose = trunkPose(body, posture, read, projection);
    return poseBones(body, pose, read?.(), requested);
  }

  /*
   * Prepare a fixed genuine bone demand for repeated complete trunk queries. No
   * posed result or FK workspace is retained by the returned producer.
   * Parameter body: The unchanged canonical body and its existing rig producer.
   * Parameter requested: Optional real output demand, snapshotted once; all outputs
   * when absent.
   * Returns: A reader of each actual posture, optional synchronous FK source
   * and optional genuine same-body ROM projector, neither retained by the
   * producer.
   */
  export function prepareTrunk(
    body: IAutoMovieMotionHumanBody,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const frames: ReturnType<typeof poseBones.prepare> | undefined =
      requested === undefined ? undefined : poseBones.prepare(body, requested);
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const pose: IAutoMoviePose = trunkPose(body, posture, read, projection);
      return frames === undefined
        ? poseBones(body, pose, read())
        : frames(pose, read());
    };
  }

  /*
   * A region of a body at its resolved bones.
   * Parameter body: The body.
   * Parameter bones: Its resolved bones.
   * Parameter region: The region.
   * Parameter tangent: A point of the region's surface beside its own point, as an
   * offset on its tangent plane; absent or zero, the region's own point.
   * Returns: World point and outward normal.
   * When an offset is asked of a region the engine does not
   * place by a ray.
   */
  export function region(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    region: AutoMovieHumanoidRegion,
    tangent?: IAutoMovieHumanoidSurfaces.ITangent,
  ): IAutoMovieMotionHumanStrikingBody.IRegionResult {
    const local: IAutoMovieHumanoidSurfaces.IFrame = frame(
      body,
      region,
      tangent,
    );
    const placed: ReturnType<
      typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal
    > = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal(
      local,
      bones.get(local.bone)!,
    );
    return placed;
  }
  /*
   * A region's fixed bone-local frame, including an authored tangent offset.
   * Parameter body: The unchanged canonical body supplying the physical skin.
   * Parameter region: The named anatomical region.
   * Parameter tangent: Optional fixed offset on its tangent plane; absent or zero
   * keeps the prepared centre frame.
   * Returns: The actual engine frame in its owning bone's coordinates.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    region: AutoMovieHumanoidRegion,
    tangent?: IAutoMovieHumanoidSurfaces.ITangent,
  ): IAutoMovieHumanoidSurfaces.IFrame {
    return tangent === undefined || (tangent.up === 0 && tangent.out === 0)
      ? body.surfaces.regions[region]
      : AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfaceOffset(
          body.skeleton,
          body.profile,
          region,
          tangent,
        );
  }

  /*
   * A region's radius: the extent the body built for it with its surfaces
   * (`AutoMovieHumanoidSurfaceExtents`), the disc about its point that is still
   * that region, so a strike aimed within it lands on that region.
   * Parameter body: The body.
   * Parameter region: The region.
   * Returns: The radius, metres.
   * When the body's surface table gives the region no extent, a
   * defect of the body's producer.
   */
  export function radius(
    body: IAutoMovieMotionHumanBody,
    region: AutoMovieHumanoidRegion,
  ): number {
    const extent: number | undefined = body.surfaces.regions[region].radius;
    if (extent === undefined)
      throw new Error(
        `The body's surface table gives the region ${region} no extent`,
      );
    return extent;
  }

  /*
   * A hand or foot socket's offset from its wrist or ankle under a world
   * rotation of that hand or foot.
   * Parameter body: The body.
   * Parameter socket: The socket.
   * Parameter rotation: The hand's or foot's world rotation from its rest.
   * Returns: The offset, world metres.
   */
  export function socket(
    body: IAutoMovieMotionHumanBody,
    socket: AutoMovieHumanoidSocket,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    return AutoMovieEngineQuaternion.rotateVector(
      rotation,
      body.surfaces.sockets[socket].point,
    );
  }

  /*
   * The hand's world rotation that points the fist along a direction with the
   * palm facing a second direction: the rest finger axis (from the wrist to the
   * middle knuckle, along the arm in the T-pose) onto `knuckles` and the rest
   * palm normal (down) toward `palm`.
   * Parameter body: The body.
   * Parameter side: The hand.
   * Parameter knuckles: Where the fist's front faces, world direction.
   * Parameter palm: Where the palm faces, world direction (not parallel to
   * `knuckles`).
   * Returns: The rotation.
   */
  export function fist(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    knuckles: IAutoMovieVector3,
    palm: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    const fingers: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      body.rest.get(`${side}MiddleProximal`)!,
      body.rest.get(`${side}Hand`)!,
    );
    return HumanHand.align(
      { normal: fingers, forward: { x: 0, y: -1, z: 0 } },
      { normal: knuckles, forward: palm },
    );
  }

  /*
   * The foot's world rotation that points the toes along a direction with the
   * top of the foot (the instep) facing a second direction: the rest toe axis
   * (+Z) onto `toes`, the rest instep normal (+Y) toward `instep`.
   * Parameter toes: Where the toes point, world direction.
   * Parameter instep: Where the instep faces, world direction (not parallel to
   * `toes`).
   * Returns: The rotation.
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

  /*
   * The closed fist's finger and thumb angles, clinical degrees: the
   * metacarpophalangeal, proximal and distal interphalangeal joints at 85, 100
   * and 70 degrees, inside their normal 90, 100 and 80 degree ranges (American
   * Academy of Orthopaedic Surgeons, Joint Motion, 1965), with the thumb folded
   * 40 degrees across the middle phalanges. A finger curl has no effector goal
   * the limb solver could express, so it is set as angles.
   * Parameter side: The hand.
   * Returns: Clinical angles by bone.
   */
  export function curl(
    side: AutoMovieHumanSide,
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

  /*
   * Another body's collision shapes posed by its bones: every shape of every
   * physical-profile segment (the same shapes its regions are resolved on),
   * each with the posed frame of its segment as `HumanColliders.placed`, the
   * single owner of collider placement, gives it.
   * Parameter body: The other body.
   * Parameter bones: Its resolved bones.
   * Returns: The colliders, named by bone.
   */
  export function colliders(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieMotionHumanStrikingContact.ICollider[] {
    return HumanColliders.placed(body, bones).flatMap(
      (
        segment: IAutoMovieMotionHumanColliders.IPlaced,
      ): IAutoMovieMotionHumanStrikingContact.ICollider[] =>
        segment.shapes.map(
          (
            shape: IAutoMoviePhysicalShape,
          ): IAutoMovieMotionHumanStrikingContact.ICollider => ({
            name: segment.bone,
            pose: segment.pose,
            shape,
          }),
        ),
    );
  }

  /*
   * The exact original complete admission/digit path with only limb goals
   * cleared.
   */
  function trunkPose(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    read?: ReturnType<typeof prepareHumanPoseResolution>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMoviePose {
    return resolveHumanPosture.seeded(
      body,
      { ...posture, limbs: {} },
      undefined,
      undefined,
      read,
      undefined,
      projection,
    ).pose;
  }
}

import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/**
 * Where a wearable sits once worn: its `wear` socket on the body region it
 * goes onto, the socket's `+Y` toward the body (into the region, against the
 * region's outward normal), and the thing turned so its front faces the way
 * the body faces (`createWearable`'s contacts: a hat's crown inside on the
 * head's crown, a pair of spectacles' bridge on the nose's bridge).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is placed where and how it is turned.
 * @evidence contracts/development/design.md#principled-representation The wearable's frame in the world, from its own socket and the body's own region.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three readers of one placement: one frame (`frame`, read by the grasp-use search), a fixed site tried at many turns (`prepareSite`, read by `dressTurn`) and a site read on a moving posture (`prepareMoving`, read by `dress`'s stroke).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The socket is the wearable's own contact and the place the body's own region; no offset is typed.
 */
export namespace HumanWorn {
  /**
   * The frame a wearable takes on a posture's region.
   *
   * @param body The body.
   * @param posture The posture the region is read on.
   * @param prop The wearable.
   * @param region The region it goes onto.
   * @param turn A turn about the region's normal from facing the body's way, degrees; 0 when absent.
   * @returns The wearable's world frame.
   * @throws {HumanRefusal} When the wearable declares no `wear` socket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The socket's `+Y` turned onto the region's inward normal exactly and the wearable's front (its `+Z`, or its `+Y` where the socket runs along `Z`) onto the body's forward (or up) as nearly as that allows (`HumanHand.align`); the origin follows so the socket lies on the region's point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The fixed site's frame at one turn (`prepareSite`).
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A wearable without its socket is refused with its contacts.
   * @evidence contracts/development/implementation.md#efficient-algorithms One socket lookup, one region read and one alignment; a caller trying many turns prepares the site once instead.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `prepareSite`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    prop: IAutoMovieMotionHumanProp,
    region: AutoMovieHumanoidRegion,
    turn: number = 0,
  ): IAutoMovieRigidTransform {
    return prepareSite(body, posture, prop, region).frame(turn);
  }

  /**
   * A wearable's site on a fixed posture, read once and tried at many turns.
   *
   * @param body The body.
   * @param posture The posture whose region receives the wearable.
   * @param prop The wearable.
   * @param region The region it goes onto.
   * @returns `frame`, the wearable's world frame at a turn about the region's normal, degrees; `point`, a copy of the region's world point, metres.
   * @throws {HumanRefusal} When the wearable declares no `wear` socket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed inputs, the two readers with their units and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The socket and the alignment do not depend on the turn, so only the turn's rotation about the region's normal and the translation are computed per call.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Socket, region, alignment, then the two readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The point is the region's own, never one reconstructed from a placed wearable.
   * @evidence contracts/development/implementation.md#efficient-algorithms One socket lookup, one region read and one alignment serve every turn; each turn costs constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The site is shared only across one fixed body, posture, wearable and region.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The readers hold the socket, the region and the alignment until the caller drops them; each result is a fresh record.
   */
  export function prepareSite(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture,
    prop: IAutoMovieMotionHumanProp, region: AutoMovieHumanoidRegion): {
    frame: (turn: number) => IAutoMovieRigidTransform;
    point: () => IAutoMovieVector3;
  } {
    const wear: IAutoMovieAffordance = socketOf(prop);
    const at: ReturnType<typeof HumanTrunk.region> = HumanTrunk.region(
      body,
      posture,
      region,
    );
    const aligned: IAutoMovieQuaternion = alignment(wear)(at, posture.yaw);
    const frame: (turn: number) => IAutoMovieRigidTransform = (turn: number): IAutoMovieRigidTransform => {
      return placed(at, aligned, wear, turn);
    };
    return { frame, point: (): IAutoMovieVector3 => ({ ...at.point }) };
  }

  /**
   * A wearable's frame on a posture that changes from call to call, such as
   * the stroke that carries it onto the head.
   *
   * @param body The body.
   * @param prop The wearable.
   * @param region The region it goes onto.
   * @returns For a posture, a turn in degrees and an optional pose workspace, the wearable's world frame.
   * @throws {HumanRefusal} At the first call, when the wearable declares no `wear` socket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what varies per call, the units and when the refusal is raised.
   * @evidence contracts/development/implementation.md#principled-implementation The same placement as `frame`, with the region read on each call's own posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Socket, region reader and the wearable's rest basis bound at the first call; each call reads its region, aligns and places.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No region or frame of an earlier call is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per call one region read on the region's bone chain and one alignment.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the body's, the wearable's and the region's fixed data are bound once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds the socket, the region reader and the rest basis until the plan that owns it is dropped; each frame is a fresh record.
   */
  export function prepareMoving(body: IAutoMovieMotionHumanBody, prop: IAutoMovieMotionHumanProp,
    region: AutoMovieHumanoidRegion): (posture: IAutoMovieMotionHumanPosture, turn: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IAutoMovieRigidTransform {
    let wear: IAutoMovieAffordance | undefined;
    let read: ReturnType<typeof HumanTrunk.prepareRegion> | undefined;
    let align: ReturnType<typeof alignment> | undefined;
    return (posture: IAutoMovieMotionHumanPosture, turn: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieRigidTransform => {
      wear ??= socketOf(prop);
      read ??= HumanTrunk.prepareRegion(body, region);
      const at: ReturnType<typeof HumanTrunk.region> = read(posture, resolution);
      align ??= alignment(wear);
      return placed(at, align(at, posture.yaw), wear, turn);
    };
  }
}

/** The wearable's `wear` socket, or the refusal naming the contacts it does declare. */
function socketOf(prop: IAutoMovieMotionHumanProp): IAutoMovieAffordance {
  const affordances: readonly IAutoMovieAffordance[] = prop.affordances ?? [];
  const wear: IAutoMovieAffordance | undefined = affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "wear");
  if (wear === undefined)
    throw new HumanRefusal({ kind: "affordance", axis: "prop", value: prop.subject,
      feasible: { kind: "alternatives", values: affordances.map((a: IAutoMovieAffordance): string => a.id) },
      reason: `${prop.subject} declares no wear socket to put on by`,
      fix: "dress in a wearable that declares where it is worn, as createWearable does" });
  return wear;
}

/**
 * The rotation that lays the wear socket on a region: the socket's `+Y`
 * onto the region's inward normal, and the wearable's front onto the
 * body's forward. A socket whose `+Y` runs within about 26 degrees of the
 * wearable's `Z` (|z| > 0.9, cos 26 degrees) takes `+Y` as its front and
 * the world's up as the target, since its `Z` is then too near the normal
 * to name a front.
 */
function alignment(wear: IAutoMovieAffordance):
  (at: ReturnType<typeof HumanTrunk.region>, yaw: number) => IAutoMovieQuaternion {
  const into: IAutoMovieVector3 = Quaternion.rotateVector(wear.frame.rotation, { x: 0, y: 1, z: 0 });
  const along: boolean = Math.abs(into.z) > 0.9;
  const align: ReturnType<typeof HumanHand.prepareAlignment> = HumanHand.prepareAlignment({
    normal: into, forward: along ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 },
  });
  return (at: ReturnType<typeof HumanTrunk.region>, yaw: number): IAutoMovieQuaternion => align({
    normal: Vector3.scale(at.normal, -1),
    forward: along ? { x: 0, y: 1, z: 0 }
      : HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, { x: 0, y: 0, z: 1 }),
  });
}

/** The wearable's frame at a turn about the region's normal, its socket on the region's point. */
function placed(at: ReturnType<typeof HumanTrunk.region>, aligned: IAutoMovieQuaternion,
  wear: IAutoMovieAffordance, turn: number): IAutoMovieRigidTransform {
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(Quaternion.fromAxisAngle(at.normal, turn), aligned));
  return { position: Vector3.subtract(at.point, Quaternion.rotateVector(rotation, wear.frame.translation)), rotation };
}

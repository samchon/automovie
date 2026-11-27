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

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";

/*
 * Where a wearable sits once worn: its `wear` socket on the body region it goes
 * onto, the socket's `+Y` toward the body (into the region, against the
 * region's outward normal), and the thing turned so its front faces the way the
 * body faces (`AutoMovieArchetypeWearable.create`'s contacts: a hat's crown
 * inside on the head's crown, a pair of spectacles' bridge on the nose's bridge).
 */
export namespace HumanWorn {
  /*
   * The frame a wearable takes on a posture's region.
   * Parameter body: The body.
   * Parameter posture: The posture the region is read on.
   * Parameter prop: The wearable.
   * Parameter region: The region it goes onto.
   * Parameter turn: A turn about the region's normal from facing the body's way,
   * degrees; 0 when absent.
   * Returns: The wearable's world frame.
   * When the wearable declares no `wear` socket.
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

  /*
   * A wearable's site on a fixed posture, read once and tried at many turns.
   * Parameter body: The body.
   * Parameter posture: The posture whose region receives the wearable.
   * Parameter prop: The wearable.
   * Parameter region: The region it goes onto.
   * Returns: `frame`, the wearable's world frame at a turn about the region's
   * normal, degrees; `point`, a copy of the region's world point, metres.
   * When the wearable declares no `wear` socket.
   */
  export function prepareSite(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    prop: IAutoMovieMotionHumanProp,
    region: AutoMovieHumanoidRegion,
  ): IPrepareSiteResult {
    const wear: IAutoMovieAffordance = socketOf(prop);
    const at: ReturnType<typeof HumanTrunk.region> = HumanTrunk.region(
      body,
      posture,
      region,
    );
    const aligned: IAutoMovieQuaternion = alignment(wear)(at, posture.yaw);
    const frame: (turn: number) => IAutoMovieRigidTransform = (
      turn: number,
    ): IAutoMovieRigidTransform => {
      return placed(at, aligned, wear, turn);
    };
    return { frame, point: (): IAutoMovieVector3 => ({ ...at.point }) };
  }

  /*
   * A wearable's frame on a posture that changes from call to call, such as the
   * stroke that carries it onto the head.
   * Parameter body: The body.
   * Parameter prop: The wearable.
   * Parameter region: The region it goes onto.
   * Returns: For a posture, a turn in degrees and an optional pose workspace,
   * the wearable's world frame.
   * When the wearable declares no `wear` socket.
   */
  export function prepareMoving(
    body: IAutoMovieMotionHumanBody,
    prop: IAutoMovieMotionHumanProp,
    region: AutoMovieHumanoidRegion,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    turn: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieRigidTransform {
    const wear: IAutoMovieAffordance = socketOf(prop);
    const read: ReturnType<typeof HumanTrunk.prepareRegion> =
      HumanTrunk.prepareRegion(body, region);
    const align: ReturnType<typeof alignment> = alignment(wear);
    return (
      posture: IAutoMovieMotionHumanPosture,
      turn: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieRigidTransform => {
      const at: ReturnType<typeof HumanTrunk.region> = read(
        posture,
        resolution,
      );
      return placed(at, align(at, posture.yaw), wear, turn);
    };
  }
}

/*
 * The record of `IPrepareSiteResult`'s site.
 */
type IPrepareSiteResult = {
  frame: (turn: number) => IAutoMovieRigidTransform;
  point: () => IAutoMovieVector3;
};

/*
 * The wearable's `wear` socket, or the refusal naming the contacts it does
 * declare.
 */
function socketOf(prop: IAutoMovieMotionHumanProp): IAutoMovieAffordance {
  const affordances: readonly IAutoMovieAffordance[] = prop.affordances ?? [];
  const wear: IAutoMovieAffordance | undefined = affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "wear",
  );
  if (wear === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: prop.subject,
      feasible: {
        kind: "alternatives",
        values: affordances.map((a: IAutoMovieAffordance): string => a.id),
      },
      reason: `${prop.subject} declares no wear socket to put on by`,
      fix:
        "dress in a wearable that declares where it is worn, as AutoMovieArchetypeWearable.create does",
    });
  return wear;
}

/*
 * The rotation that lays the wear socket on a region: the socket's `+Y` onto
 * the region's inward normal, and the wearable's front onto the body's forward.
 * A socket whose `+Y` runs within about 26 degrees of the wearable's `Z` (|z| >
 * 0.9, cos 26 degrees) takes `+Y` as its front and the world's up as the
 * target, since its `Z` is then too near the normal to name a front.
 */
function alignment(
  wear: IAutoMovieAffordance,
): (
  at: ReturnType<typeof HumanTrunk.region>,
  yaw: number,
) => IAutoMovieQuaternion {
  const into: IAutoMovieVector3 = Quaternion.rotateVector(wear.frame.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const along: boolean = Math.abs(into.z) > 0.9;
  const align: ReturnType<typeof HumanHand.prepareAlignment> =
    HumanHand.prepareAlignment({
      normal: into,
      forward: along ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 },
    });
  return (
    at: ReturnType<typeof HumanTrunk.region>,
    yaw: number,
  ): IAutoMovieQuaternion =>
    align({
      normal: Vector3.scale(at.normal, -1),
      forward: along
        ? { x: 0, y: 1, z: 0 }
        : HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw },
            { x: 0, y: 0, z: 1 },
          ),
    });
}

/*
 * The wearable's frame at a turn about the region's normal, its socket on the
 * region's point.
 */
function placed(
  at: ReturnType<typeof HumanTrunk.region>,
  aligned: IAutoMovieQuaternion,
  wear: IAutoMovieAffordance,
  turn: number,
): IAutoMovieRigidTransform {
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(Quaternion.fromAxisAngle(at.normal, turn), aligned),
  );
  return {
    position: Vector3.subtract(
      at.point,
      Quaternion.rotateVector(rotation, wear.frame.translation),
    ),
    rotation,
  };
}

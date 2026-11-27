import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../../compose/AutoMovieMotionHumanRange";
import { HumanTrunk } from "../../everyday/HumanTrunk";

/**
 * The curl of a spooning body onto its partner's back: the lumbar spine flexes
 * so the chest's sternum region comes onto the back where the slide stopped
 * short of it, because the pelvis meets the partner's before the chest does. A
 * body spooning curls into the partner and does not lift off the floor. It does
 * not bend sideways either: it lies on its lower shoulder, which a bend toward
 * the floor would drive into it, so each midline keeps the height its own lying
 * width gives it.
 *
 * The flexion is the closed-form rotation about the lumbar joint that brings
 * the sternum's reach toward the back, in the plane of the trunk's long axis
 * and its front, to the target's: an arcsine less its present angle, within the
 * lumbar range. It shrinks where it would carry the head into the partner's
 * head, by the share of the head's approach that leaves the two heads' radii
 * apart. The curl also draws the sternum along the trunk, so the body slides
 * back that much across the floor along the partner's back (never along the
 * back's normal, which the hips hold).
 */
export namespace lieTogetherCurl {
  /** The curl and the slide it adds. */
  export interface ICurl {
    /** Forward flexion of the lumbar joint, clinical degrees. */
    flexion: number;

    /**
     * The slide's correction across the floor along the partner's back, world
     * metres.
     */
    shift: IAutoMovieVector3;
  }

  /** No curl. */
  export const NONE: ICurl = { flexion: 0, shift: { x: 0, y: 0, z: 0 } };

  /**
   * Solve the curl that lays the sternum on a point.
   *
   * @param body The spooning body.
   * @param posture Its posture slid up to the partner.
   * @param target Where the sternum region rests, world metres.
   * @param normal The partner's back's outward normal there.
   * @param partner The partner's body.
   * @param bones The partner's world bones.
   * @returns The curl.
   */
  export function solve(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    target: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    partner: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): ICurl {
    const own: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(
        body,
        posture,
        undefined,
        undefined,
        new Set<AutoMovieHumanoidBone>(["spine", "chest", "neck", "head"]),
      );
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      own.get(bone)!.worldPosition;

    // The trunk's frame at the lumbar joint: its long axis, its front
    // (toward the partner's back) and its left, the axis of its flexion.
    const pivot: IAutoMovieVector3 = at("spine");
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(at("chest"), pivot),
    );
    const toward: IAutoMovieVector3 = { x: -normal.x, y: 0, z: -normal.z };
    const front: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(toward, Vector3.scale(axis, Vector3.dot(toward, axis))),
    );
    const left: IAutoMovieVector3 = Vector3.cross(axis, front);

    // The flexion that brings the sternum's reach toward the back to the
    // target's, on its circle about the lumbar joint.
    const sternum: IAutoMovieVector3 = HumanTrunk.region(
      body,
      posture,
      "sternum",
    ).point;
    const arm: IAutoMovieVector3 = Vector3.subtract(sternum, pivot);
    const up: number = Vector3.dot(arm, axis);
    const out: number = Vector3.dot(arm, front);
    const goal: number = Math.max(
      -1,
      Math.min(
        1,
        (out + Vector3.dot(Vector3.subtract(target, sternum), front)) /
          Math.hypot(up, out),
      ),
    );
    const flexion: number = Math.max(
      0,
      Math.min(
        AutoMovieMotionHumanRange.degrees("spine", "flexion", "full"),
        ((Math.asin(goal) - Math.atan2(out, up)) * 180) / Math.PI,
      ),
    );

    // The head's centre turned with the trunk: the curl shrinks to the share
    // of the head's approach that leaves the two heads' radii apart.
    const centre = (
      head: IAutoMovieVector3,
      neck: IAutoMovieVector3,
      radius: number,
    ): IAutoMovieVector3 =>
      Vector3.add(
        head,
        Vector3.scale(Vector3.normalize(Vector3.subtract(head, neck)), radius),
      );
    const turned = (
      degrees: number,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        left,
        degrees,
      );
      return Vector3.add(
        pivot,
        Quaternion.rotateVector(turn, Vector3.subtract(point, pivot)),
      );
    };
    const mine: IAutoMovieVector3 = centre(
      at("head"),
      at("neck"),
      body.measure.headRadius,
    );
    const theirs: IAutoMovieVector3 = centre(
      bones.get("head")!.worldPosition,
      bones.get("neck")!.worldPosition,
      partner.measure.headRadius,
    );
    const clear: number = body.measure.headRadius + partner.measure.headRadius;
    const before: number = Vector3.distance(mine, theirs);
    const after: number = Vector3.distance(turned(flexion, mine), theirs);
    const share: number =
      after >= clear
        ? 1
        : before <= clear
          ? 0
          : (before - clear) / (before - after);
    const kept: number = flexion * share;

    // The slide back along the partner's back that keeps the curled sternum
    // over its point.
    const across: IAutoMovieVector3 = Vector3.normalize({
      x: -toward.z,
      y: 0,
      z: toward.x,
    });
    const miss: IAutoMovieVector3 = Vector3.subtract(
      target,
      turned(kept, sternum),
    );
    return {
      flexion: kept,
      shift: Vector3.scale(across, Vector3.dot(miss, across)),
    };
  }

  /**
   * A posture curled by a share of a curl.
   *
   * @param posture The posture.
   * @param curl The curl.
   * @param share Its share, 0 to 1.
   * @returns The curled posture.
   */
  export function apply(
    posture: IAutoMovieMotionHumanPosture,
    curl: ICurl,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (curl.flexion === 0) return posture;
    const was: readonly [number, number, number] = posture.joints.spine ?? [
      0, 0, 0,
    ];
    return {
      ...posture,
      joints: {
        ...posture.joints,
        spine: [was[0] + curl.flexion * share, was[1], was[2]],
      },
    };
  }
}

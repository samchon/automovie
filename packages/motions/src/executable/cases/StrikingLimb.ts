import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { HumanSegment } from "../../perform/HumanSegment";
import { HumanColliders } from "../../posture/HumanColliders";

/**
 * A striking limb as the capture audits it, read from the displayed bones and
 * the body's own measure, never from the striking laws: which hand or foot
 * carries the strike, the limb as capsules, the capsules' signed gap to
 * another posed body, and the bare limb's length from its root joint.
 *
 * The capsules are the upper arm, the forearm and the fist, or the thigh, the
 * shank and the foot. Every gap is the exact segment distance of
 * `HumanColliders.distanceToSegment` less the capsule's radius, so a depth is
 * the limb's own wherever along it the other body is met.
 */
export namespace StrikingLimb {
  /** The end joint that carries a strike. */
  export type End = "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

  /** A body's posed bones, world frame. */
  export type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /** One capsule of a limb on shown bones: an axis swept by a radius, world metres. */
  export interface ICapsule {
    /** What part of the limb it is. */
    name: string;

    /** One end of its axis. */
    a: IAutoMovieVector3;

    /** The other end. */
    b: IAutoMovieVector3;

    /** Its radius, metres. */
    radius: number;
  }

  /** A limb's signed gap to another body. */
  export interface IGap {
    /** Metres between the surfaces, negative when the limb is inside. */
    distance: number;

    /** The other body's nearest bone; undefined when there is no other body. */
    bone: AutoMovieHumanoidBone | undefined;

    /** The limb's capsule that is nearest. */
    part: string;
  }

  /**
   * The end joint carrying a strike: the hand (a punch) or the foot (a kick
   * or a knee) that moves farthest from the segment's entry to its planned
   * contact, or to half its duration when it plans none.
   *
   * @param performance The performance.
   * @param subject The striker.
   * @param segment The strike's segment.
   * @returns The end joint.
   */
  export function end(
    performance: HumanPerformance,
    subject: string,
    segment: HumanSegment.ISegment,
  ): End {
    const start: Bones = performance.bones(subject, segment.entryTime);
    const mid: Bones = performance.bones(
      subject,
      segment.start + (segment.plan.contact ?? segment.plan.duration / 2),
    );
    const candidates: readonly End[] =
      segment.name === "punch"
        ? ["leftHand", "rightHand"]
        : ["leftFoot", "rightFoot"];
    let best: End = candidates[0]!;
    let far: number = -1;
    for (const bone of candidates) {
      const moved: number = Vector3.length(
        Vector3.subtract(
          mid.get(bone)!.worldPosition,
          start.get(bone)!.worldPosition,
        ),
      );
      if (moved > far) {
        far = moved;
        best = bone;
      }
    }
    return best;
  }

  /**
   * The side of an end joint.
   *
   * @param limb The end joint.
   * @returns Left or right.
   */
  export function side(limb: End): "left" | "right" {
    return limb === "leftHand" || limb === "leftFoot" ? "left" : "right";
  }

  /**
   * Whether an end joint is a foot.
   *
   * @param limb The end joint.
   * @returns True for a leg.
   */
  export function leg(limb: End): boolean {
    return limb === "leftFoot" || limb === "rightFoot";
  }

  /**
   * The root joint a limb hangs from: the hip or the shoulder.
   *
   * @param limb The end joint.
   * @returns The upper leg's or the upper arm's bone.
   */
  export function root(limb: End): AutoMovieHumanoidBone {
    return leg(limb) ? `${side(limb)}UpperLeg` : `${side(limb)}UpperArm`;
  }

  /**
   * A bare limb's length from its root joint, metres, an anatomical bound no
   * strike exceeds: the thigh, the shank and the foot for a kick, the thigh
   * and its radius for a knee, and the upper arm, the forearm and the hand
   * for a punch.
   *
   * @param body The body.
   * @param limb The end joint.
   * @param knee Whether the strike is a knee, which ends at the kneecap.
   * @returns The length.
   */
  export function length(body: IHumanBody, limb: End, knee: boolean): number {
    const m: IHumanBody["measure"] = body.measure;
    if (knee) return m.thigh + m.thighRadius;
    return leg(limb)
      ? m.thigh + m.shank + m.footLength
      : m.upperArm + m.forearm + m.hand;
  }

  /**
   * A limb's capsules on shown bones, measured from the body.
   *
   * A leg is the thigh from the hip to the knee with the thigh's radius, the
   * shank from the knee to the ankle with the shank's radius, and the foot
   * from the ankle to the ball with half the ankle's height. An arm is the
   * upper arm from the shoulder to the elbow with its radius, the forearm
   * from the elbow to the wrist, and the fist from the wrist to one forearm
   * radius behind the knuckles, both of the forearm's radius, so the fist's
   * front is the knuckles.
   *
   * @param body The limb's body.
   * @param bones Its posed bones.
   * @param limb The end joint.
   * @returns The capsules, from the root outward.
   */
  export function capsules(body: IHumanBody, bones: Bones, limb: End): ICapsule[] {
    const s: "left" | "right" = side(limb);
    if (leg(limb)) {
      const foot: IAutoMovieResolvedBone = bones.get(`${s}Foot`)!;
      const knee: IAutoMovieVector3 = bones.get(`${s}LowerLeg`)!.worldPosition;
      return [
        {
          name: "thigh",
          a: bones.get(`${s}UpperLeg`)!.worldPosition,
          b: knee,
          radius: body.measure.thighRadius,
        },
        {
          name: "shank",
          a: knee,
          b: foot.worldPosition,
          radius: body.measure.shankRadius,
        },
        {
          name: "foot",
          a: foot.worldPosition,
          b: resolveAutoMovieHumanoidSurfaces.place(
            body.surfaces.sockets[s === "left" ? "ballLeft" : "ballRight"],
            foot,
          ).point,
          radius: 0.5 * body.measure.ankleHeight,
        },
      ];
    }
    const hand: IAutoMovieResolvedBone = bones.get(`${s}Hand`)!;
    const elbow: IAutoMovieVector3 = bones.get(`${s}LowerArm`)!.worldPosition;
    const reach: IAutoMovieVector3 = Vector3.subtract(
      resolveAutoMovieHumanoidSurfaces.place(
        body.surfaces.sockets[s === "left" ? "fistLeft" : "fistRight"],
        hand,
      ).point,
      hand.worldPosition,
    );
    const span: number = Vector3.length(reach);
    const r: number = body.measure.forearmRadius;
    return [
      {
        name: "upper arm",
        a: bones.get(`${s}UpperArm`)!.worldPosition,
        b: elbow,
        radius: body.measure.upperArmRadius,
      },
      { name: "forearm", a: elbow, b: hand.worldPosition, radius: r },
      {
        name: "fist",
        a: hand.worldPosition,
        b: Vector3.add(
          hand.worldPosition,
          Vector3.scale(reach, Math.max(0, span - r) / Math.max(1e-9, span)),
        ),
        radius: r,
      },
    ];
  }

  /**
   * A limb's signed gap to another posed body: the least over the limb's
   * capsules of the exact distance from the capsule's axis to the other
   * body's colliders, less the capsule's radius.
   *
   * @param body The limb's body.
   * @param bones Its posed bones.
   * @param limb The end joint.
   * @param other The other body.
   * @param others The other body's posed bones.
   * @returns The gap, the other body's nearest bone and the limb's nearest capsule.
   */
  export function gap(
    body: IHumanBody,
    bones: Bones,
    limb: End,
    other: IHumanBody,
    others: Bones,
  ): IGap {
    let best: IGap = { distance: Infinity, bone: undefined, part: "nothing" };
    for (const c of capsules(body, bones, limb)) {
      const near: HumanColliders.IDistance = HumanColliders.distanceToSegment(
        other,
        others,
        c.a,
        c.b,
      );
      if (near.distance - c.radius < best.distance)
        best = {
          distance: near.distance - c.radius,
          bone: near.bone,
          part: c.name,
        };
    }
    return best;
  }
}

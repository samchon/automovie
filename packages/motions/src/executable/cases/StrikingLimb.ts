import {
  type IAutoMovieResolvedBone,
  Quaternion,
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
import { StrikingRecord } from "../../striking/StrikingRecord";
import { StrikingWeapon } from "../../striking/StrikingWeapon";

/**
 * A striking limb as the capture audits it, measured on the displayed bones
 * and the body's own measure: which hand or foot carries the strike (the one
 * its record declares), the limb as capsules, the capsules' signed gap to
 * another posed body, and the bare limb's length from its root joint.
 *
 * The capsules are the upper arm, the forearm and the fist, or the thigh, the
 * shank and the foot, each tapered between its joints' girths. Every gap is
 * the exact tapered-capsule distance of `HumanColliders.distanceToSegment`,
 * so a depth is the limb's own wherever along it the other body is met.
 */
export namespace StrikingLimb {
  /** The end joint that carries a strike. */
  export type End = "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

  /** A body's posed bones, world frame. */
  export type Bones = ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  >;

  /** One capsule of a limb on shown bones: an axis swept by a radius, world metres. */
  export interface ICapsule {
    /** What part of the limb it is. */
    name: string;

    /** One end of its axis. */
    a: IAutoMovieVector3;

    /** The other end. */
    b: IAutoMovieVector3;

    /** Its radius at `a`, metres. */
    radius: number;

    /** Its radius at `b`, metres: the capsule tapers linearly between the two. */
    tail: number;
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
   * The end joint carrying a strike: the limb the strike's record declares,
   * which every verdict then measures on the displayed bones, so a strike
   * shown with another limb than it declared fails its extension and its
   * contact. The other limbs move too (the guard follows the head, which
   * stays on the opponent while the trunk turns), so travel alone does not
   * name the weapon. A strike without a record is read from the display: the
   * hand (a punch) or the foot (a kick or a knee) that moves farthest from
   * the segment's entry to the instant
   * the strike is audited at: its stop when it met something, its peak
   * otherwise. A strike stopped early has not moved its limb at the planned
   * contact it never reaches, so that instant is not the one read.
   *
   * A hand's travel is read in the frame of the highest chest bone the
   * skeleton has (the upper chest, or the chest), a foot's in the
   * world: a rear-hand punch turns the trunk by about 60 degrees, which
   * carries the guarding lead hand farther through the world than the
   * punching fist travels, while only the punching arm moves against the
   * chest it hangs from. A kick's support foot is planted in the world.
   *
   * @param performance The performance.
   * @param subject The striker.
   * @param segment The strike's segment.
   * @param until The audited instant, film seconds.
   * @returns The end joint.
   */
  export function end(
    performance: HumanPerformance,
    subject: string,
    segment: HumanSegment.ISegment,
    until: number,
  ): End {
    const declared: End | undefined = StrikingRecord.of(segment.plan)?.limb;
    if (declared !== undefined) return declared;
    const start: Bones = performance.bones(subject, segment.entryTime);
    const mid: Bones = performance.bones(subject, until);
    const punch: boolean = segment.name === "punch";
    const candidates: readonly End[] = punch
      ? ["leftHand", "rightHand"]
      : ["leftFoot", "rightFoot"];
    const seen = (bones: Bones, bone: End): IAutoMovieVector3 => {
      const world: IAutoMovieVector3 = bones.get(bone)!.worldPosition;
      if (!punch) return world;
      const chest: IAutoMovieResolvedBone = (bones.get("upperChest") ??
        bones.get("chest"))!;
      return Quaternion.rotateVector(
        Quaternion.inverse(chest.worldRotation),
        Vector3.subtract(world, chest.worldPosition),
      );
    };
    let best: End = candidates[0]!;
    let far: number = -1;
    for (const bone of candidates) {
      const moved: number = Vector3.length(
        Vector3.subtract(seen(mid, bone), seen(start, bone)),
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
   * A leg is the thigh from the hip to the knee, the shank from the knee to
   * the ankle and the foot from the ankle to the ball, each tapered between
   * the girths the strikes' own weapons carry (`StrikingWeapon.legRadii`).
   * An arm is the
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
  export function capsules(
    body: IHumanBody,
    bones: Bones,
    limb: End,
  ): ICapsule[] {
    const s: "left" | "right" = side(limb);
    if (leg(limb)) {
      const foot: IAutoMovieResolvedBone = bones.get(`${s}Foot`)!;
      const knee: IAutoMovieVector3 = bones.get(`${s}LowerLeg`)!.worldPosition;
      const [thigh, shank, sole] = StrikingWeapon.legRadii(body);
      return [
        {
          name: "thigh",
          a: bones.get(`${s}UpperLeg`)!.worldPosition,
          b: knee,
          radius: thigh[0],
          tail: thigh[1],
        },
        {
          name: "shank",
          a: knee,
          b: foot.worldPosition,
          radius: shank[0],
          tail: shank[1],
        },
        {
          name: "foot",
          a: foot.worldPosition,
          b: resolveAutoMovieHumanoidSurfaces.place(
            body.surfaces.sockets[s === "left" ? "ballLeft" : "ballRight"],
            foot,
          ).point,
          radius: sole,
          tail: sole,
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
        tail: body.measure.upperArmRadius,
      },
      { name: "forearm", a: elbow, b: hand.worldPosition, radius: r, tail: r },
      {
        name: "fist",
        a: hand.worldPosition,
        b: Vector3.add(
          hand.worldPosition,
          Vector3.scale(reach, Math.max(0, span - r) / Math.max(1e-9, span)),
        ),
        radius: r,
        tail: r,
      },
    ];
  }

  /**
   * The signed distance from a point to a tapered capsule's surface, metres:
   * the least over the axis of the distance to the axis point less the
   * radius there. With `s` the point's coordinate along the axis from `a`,
   * `h` its distance from the axis line and `k` the radius's change per
   * metre, the derivative of `sqrt((s - u)^2 + h^2) - r(u)` vanishes at `u =
   * s + k h / sqrt(1 - k^2)`; the function is convex, so that point clamped
   * to the axis is the least. A capsule whose radius changes by its length or
   * more is one end's sphere around the other, read at both ends.
   *
   * @param point The point, world metres.
   * @param capsule The capsule.
   * @returns Metres, negative inside.
   */
  export function surface(point: IAutoMovieVector3, capsule: ICapsule): number {
    const axis: IAutoMovieVector3 = Vector3.subtract(capsule.b, capsule.a);
    const length: number = Vector3.length(axis);
    const at = (u: number): number =>
      Vector3.length(
        Vector3.subtract(
          point,
          length > 1e-12
            ? Vector3.add(capsule.a, Vector3.scale(axis, u / length))
            : capsule.a,
        ),
      ) -
      (capsule.radius +
        (length > 1e-12 ? ((capsule.tail - capsule.radius) * u) / length : 0));
    if (!(length > 1e-12)) return at(0);
    const k: number = (capsule.tail - capsule.radius) / length;
    if (!(Math.abs(k) < 1)) return Math.min(at(0), at(length));
    const from: IAutoMovieVector3 = Vector3.subtract(point, capsule.a);
    const s: number = Vector3.dot(from, axis) / length;
    const h: number = Math.sqrt(Math.max(0, Vector3.dot(from, from) - s * s));
    return at(
      Math.min(length, Math.max(0, s + (k * h) / Math.sqrt(1 - k * k))),
    );
  }

  /**
   * A limb's signed gap to another posed body: the least over the limb's
   * capsules of the exact distance from the tapered capsule to the other
   * body's colliders.
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
        [c.radius, c.tail],
      );
      if (near.distance < best.distance)
        best = {
          distance: near.distance,
          bone: near.bone,
          part: c.name,
        };
    }
    return best;
  }
}

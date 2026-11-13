import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { handGoals } from "./handGoals";

/**
 * The geometry every seat law shares: where on a seat the body's seat
 * socket rests, the root that puts it there under a trunk pitch, whether a
 * seat suits the body, and the hands resting on the thighs.
 *
 * A seat is given as the sitting surface's frame the way an `IAutoMovieAffordance`
 * of kind `seat` states it: a world point at the middle of the front edge,
 * the heading the sitter faces, an optional depth back from the edge and an
 * optional backrest height. Sitting brings the body's `seat` socket (under
 * the ischial tuberosities) onto the seat; everything else follows by
 * inverse kinematics and the trunk's pitch.
 *
 * The socket rests `thigh - 0.05 m` behind the edge, corrected by the
 * socket's own offset from the hip joints, so with a level thigh the knee
 * stands 5 cm ahead of the front edge and the thigh is supported almost to
 * the knee (provisional clearance; seating standards keep the seat shorter
 * than the buttock-to-popliteal length); a shallower seat moves the socket
 * forward to 2 cm inside its depth.
 *
 * A seat is sat on with both feet on the floor when its height lies within
 * 0.8 to 1.2 of the popliteal height, the ratio the campaign sets: a lower
 * seat needs more trunk flexion and a longer rise (Janssen, Bussmann and
 * Stam 2002, Phys Ther 82:866) and is refused. A higher one is a high seat:
 * a bar stool, a saddle, a wall. The feet leave the floor for its rests or
 * hang, and the body gets onto it by a step up or a swing of a leg. The
 * popliteal height is the knee joint's height less the thigh's radius, where
 * the thigh's underside meets a level seat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seat frame, the socket placement rule and the suitability band with sources.
 * @evidence contracts/development/implementation.md#principled-implementation The seat socket is an effector placed by solving the root for a pitch; the legs and arms are inverse-kinematics goals.
 */
export namespace seated {
  /** A seat in the world. */
  export interface ISeat {
    /** The middle of the sitting surface's front edge, world metres; its height is the seat height. */
    at: IAutoMovieVector3;

    /** The heading a sitter faces, degrees about +Y. */
    yaw: number;

    /** Depth back from the front edge, metres; deep enough for the thigh when absent. */
    depth?: number;

    /** Backrest height above the surface, metres; backless when absent. */
    back?: number;

    /** Whether the seat is sat astride, a leg on either side, as a saddle is; both legs ahead when absent. */
    astride?: boolean;

    /**
     * Where a palm rests on each armrest, world metres: the top of the
     * armrest beside the sitter. A hand with one goes to it while sitting
     * down and bears on it; a hand with none rests on its thigh.
     */
    armrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;

    /** The side a seat sat astride is got onto and off from, as a horse is mounted from its left; either side when absent or `either`. */
    mount?: "left" | "right" | "either";

    /**
     * Where a foot rests while seated, world metres: the tread a foot's ball
     * bears on (a stool's bar, a pedal, a peg, a stirrup). Read only on a
     * seat higher than the band, where the feet leave the floor; a foot with
     * no rest, or whose rest the leg cannot reach, hangs.
     */
    footrests?: Partial<Record<"left" | "right", IAutoMovieVector3>>;
  }

  /**
   * Seat heights as shares of the popliteal height that are sat on with both
   * feet on the floor. Below the band a seat is refused; above it the seat
   * is a high one ({@link high}).
   */
  export const RATIO: readonly [number, number] = [0.8, 1.2];

  /**
   * Whether a seat is a high one for a body: above the band, so the feet
   * cannot stay on the floor and the body gets onto it by a step up or a
   * swing of a leg, then sits with the feet on its rests or hanging, as on a
   * bar stool, a saddle or a wall.
   *
   * @param body The body.
   * @param seat The seat.
   * @returns Whether the seat is above the band.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a high seat is and what follows from it for the feet.
   * @evidence contracts/development/implementation.md#principled-implementation The same ratio to the popliteal height `check` reads, against the band's upper end, so a seat is refused, sat on from the floor or got onto by one measure.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the band's own constant.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function high(body: IHumanBody, seat: ISeat): boolean {
    return ratio(body, seat) > RATIO[1];
  }

  /**
   * The seat height's share of the popliteal height.
   *
   * @param body The body.
   * @param seat The seat.
   * @returns The ratio.
   */
  export function ratio(body: IHumanBody, seat: ISeat): number {
    return seat.at.y / popliteal(body);
  }

  /**
   * Refuse a seat too low to sit on from standing, naming the least height.
   * A seat above the band is not refused: it is a high seat ({@link high}).
   *
   * @param body The body.
   * @param seat The seat.
   * @throws {HumanRefusal} When the seat height lies below the band.
   */
  export function check(body: IHumanBody, seat: ISeat): void {
    const r: number = ratio(body, seat);
    if (r < RATIO[0])
      throw new HumanRefusal({
        kind: "reach",
        axis: "seat",
        value: seat.at.y,
        feasible: {
          kind: "range",
          minimum: RATIO[0] * popliteal(body),
          maximum: null,
          unit: "m",
        },
        reason: `A seat ${seat.at.y.toFixed(3)} m high is ${r.toFixed(2)} of this body's popliteal height; seats from ${(RATIO[0] * popliteal(body)).toFixed(3)} m up suit it`,
        fix: "use a seat whose height suits this body",
      });
  }

  /**
   * Where the seat socket goes when seated, world metres: back from the
   * front edge as the class comment states, and raised above the surface by
   * however far the thighs' undersides hang below the socket at rest, since
   * a seated body bears on whichever is lower, the ischial tuberosities or
   * the backs of the thighs, and neither may sink into the seat.
   *
   * @param body The body.
   * @param seat The seat.
   * @returns The socket's seated point.
   */
  export function point(body: IHumanBody, seat: ISeat): IAutoMovieVector3 {
    const socket: IAutoMovieVector3 = offset(body);
    const hipJoint: IAutoMovieVector3 = body.rest.get("leftUpperLeg")!;
    let back: number = body.measure.thigh - 0.05 + hipJoint.z - socket.z;
    if (seat.depth !== undefined) back = Math.min(back, seat.depth - 0.02);
    const lift: number = Math.max(
      0,
      socket.y - (hipJoint.y - body.measure.thighRadius),
    );
    return HumanFrame.point(
      { origin: seat.at, yaw: seat.yaw },
      { x: 0, y: lift, z: -back },
    );
  }

  /**
   * The seat socket's offset from the root at rest, metres.
   *
   * @param body The body.
   * @returns The offset.
   */
  export function offset(body: IHumanBody): IAutoMovieVector3 {
    return Vector3.add(
      body.rest.get("hips")!,
      body.surfaces.sockets.seat.point,
    );
  }

  /**
   * The root that puts the seat socket on a point under a heading and pitch.
   *
   * @param body The body.
   * @param at Where the socket goes, world metres.
   * @param heading Yaw, pitch and roll, degrees.
   * @returns The root.
   */
  export function root(
    body: IHumanBody,
    at: IAutoMovieVector3,
    heading: Pick<IHumanPosture, "yaw" | "pitch" | "roll">,
  ): IAutoMovieVector3 {
    return Vector3.subtract(
      at,
      Quaternion.rotateVector(
        resolveHumanPosture.heading(heading),
        offset(body),
      ),
    );
  }

  /**
   * The world seat socket of a posture.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns World metres.
   */
  export function socket(
    body: IHumanBody,
    posture: IHumanPosture,
  ): IAutoMovieVector3 {
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        resolveHumanPosture.heading(posture),
        offset(body),
      ),
    );
  }

  /**
   * Goals that lay each palm on the front of the same thigh, fingers toward
   * the knee, on a posture whose legs are solved first.
   *
   * @param body The body.
   * @param posture The posture with its leg goals.
   * @returns Arm goals.
   */
  export function hands(
    body: IHumanBody,
    posture: IHumanPosture,
  ): IHumanPosture["limbs"] {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, posture),
    );
    const requests: AutoMovieMotionHumanArm.ISided[] = [];
    for (const side of ["left", "right"] as const) {
      const frame: IHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
        body.surfaces.regions[
          `thighFront${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion
        ];
      const thigh: IAutoMovieResolvedBone = bones.get(frame.bone)!;
      const point: IAutoMovieVector3 = Vector3.add(
        thigh.worldPosition,
        Quaternion.rotateVector(thigh.worldRotation, frame.point),
      );
      const normal: IAutoMovieVector3 = Quaternion.rotateVector(
        thigh.worldRotation,
        frame.normal,
      );
      const along: IAutoMovieVector3 = Vector3.subtract(
        bones.get(`${side}LowerLeg`)!.worldPosition,
        thigh.worldPosition,
      );
      requests.push({
        side,
        surface: "palm",
        shape: "relaxed",
        point,
        rotation: HumanHand.rotation(side, {
          fingers: along,
          palm: Vector3.scale(normal, -1),
        }),
        bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
      });
    }
    const placed: IHumanPosture = handGoals(body, posture, requests);
    return { leftArm: placed.limbs.leftArm!, rightArm: placed.limbs.rightArm! };
  }

  /**
   * A posture whose hands have moved a share of the way from hanging, as the
   * posture's own joints hold them, to resting on the thighs: each wrist
   * travels on the straight line between the two placements and the hand
   * turns by spherical interpolation, so `share` from a minimum-jerk profile
   * gives a minimum-jerk reach.
   *
   * @param body The body.
   * @param posture The posture with its legs placed and no arm goals.
   * @param share 0 hanging to 1 on the thighs.
   * @returns The posture with arm goals, or unchanged at 0.
   */
  export function arms(
    body: IHumanBody,
    posture: IHumanPosture,
    share: number,
  ): IHumanPosture {
    if (share <= 0) return posture;
    const onThighs: IHumanPosture["limbs"] = hands(body, posture);
    if (share >= 1)
      return { ...posture, limbs: { ...posture.limbs, ...onThighs } };
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, posture),
    );
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const) {
      const limb: "leftArm" | "rightArm" =
        side === "left" ? "leftArm" : "rightArm";
      const goal: IHumanPosture.IGoal = onThighs[limb]!;
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      limbs[limb] = {
        point: Vector3.lerp(hand.worldPosition, goal.point, share),
        rotation: Quaternion.slerp(hand.worldRotation, goal.rotation!, share),
        bend: goal.bend,
      };
    }
    return { ...posture, limbs };
  }

  /**
   * A posture whose hands have moved a share of the way from where its own
   * joints hold them to the armrests: each wrist on the straight line to a
   * point a hand's thickness above its armrest, the palm turning down with
   * the fingers ahead. A hand whose side has no armrest keeps the goal the
   * posture already gives it.
   *
   * @param body The body.
   * @param posture The posture with its legs placed, and its thigh goals for the hands without an armrest.
   * @param rests The armrests, world metres.
   * @param yaw The seat's heading, degrees.
   * @param share 0 where the hands are to 1 on the armrests.
   * @returns The posture with the arm goals; a hand bears (`planted`) once it is on its armrest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the path, the palm's turn, the hand left alone and when a hand bears.
   * @evidence contracts/development/implementation.md#principled-implementation An effector goal on a target the seat declares, travelled on the caller's eased share, as the hands' way to the thighs is; the hand's thickness is the body's own, a fifth of the hand's length (provisional).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the two hands.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An armrest out of the arm's reach is not checked here: the limb fit leaves the hand short of it, which the contact audit reports; a refusal with the reachable band is owed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass and constant work per hand.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function onArmrests(
    body: IHumanBody,
    posture: IHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>>,
    yaw: number,
    share: number,
  ): IHumanPosture {
    if (share <= 0) return posture;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, { ...posture, limbs: legsOnly(posture) }),
    );
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    const s: number = Math.min(1, share);
    for (const side of ["left", "right"] as const) {
      const rest: IAutoMovieVector3 | undefined = rests[side];
      if (rest === undefined) continue;
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      limbs[`${side}Arm`] = {
        point: Vector3.lerp(
          hand.worldPosition,
          { ...rest, y: rest.y + 0.2 * body.measure.hand },
          s,
        ),
        rotation: Quaternion.slerp(
          hand.worldRotation,
          HumanHand.rotation(side, {
            fingers: HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw },
              { x: 0, y: 0, z: 1 },
            ),
            palm: { x: 0, y: -1, z: 0 },
          }),
          s,
        ),
        bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
        planted: s >= 1,
      };
    }
    return { ...posture, limbs };
  }

  /** A posture's leg goals alone, so its hands are read where its own joints hold them. */
  function legsOnly(posture: IHumanPosture): IHumanPosture["limbs"] {
    return {
      ...(posture.limbs.leftLeg === undefined
        ? {}
        : { leftLeg: posture.limbs.leftLeg }),
      ...(posture.limbs.rightLeg === undefined
        ? {}
        : { rightLeg: posture.limbs.rightLeg }),
    };
  }

  /**
   * The popliteal height at rest, metres: the floor to the underside of the
   * thigh just behind the knee, the knee joint's height less the thigh's
   * radius, the height a seat is measured against (seated anthropometry,
   * ANSI/HFES 100-2007).
   *
   * @param body The body.
   * @returns Metres.
   */
  export function popliteal(body: IHumanBody): number {
    return (
      body.measure.ankleHeight + body.measure.shank - body.measure.thighRadius
    );
  }
}

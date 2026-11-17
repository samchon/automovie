import type { AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieMotionHumanArmTarget, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanEntryState, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSeated, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
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
 * A seat is sat on with both feet on the floor when its height above the
 * floor under the feet (the ground, or the floor of a prop they stand on,
 * as a boat's) lies within 0.8 to 1.2 of the popliteal height, the ratio
 * the campaign sets (#3363): a lower
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
   * @param under The floor's height under the feet, world metres; the ground's 0 when absent.
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
  export function high(
    body: IAutoMovieMotionHumanBody,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    under: number = 0,
  ): boolean {
    return ratio(body, seat, under) > RATIO[1];
  }

  /**
   * The seat height's share of the popliteal height, the height measured
   * from the floor the feet stand on ({@link floor}).
   *
   * @param body The body.
   * @param seat The seat.
   * @param under The floor's height under the feet, world metres; the ground's 0 when absent.
   * @returns The ratio.
   */
  export function ratio(
    body: IAutoMovieMotionHumanBody,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    under: number = 0,
  ): number {
    return (seat.at.y - under) / popliteal(body);
  }

  /**
   * The height of the floor the feet stand on at an entry, world metres: a
   * seat's height is measured from it, since the legs reach from the seat
   * down to it. On the ground it is the ground's 0; a foot planted on a
   * prop (a boat's floor, a stage, a deck) stands on that prop's floor,
   * which is read on its displayed bearing sockets, even with its heel raised.
   * The lowest such sole is the floor, as the lower foot reaches farthest.
   *
   * @param body The body.
   * @param entry The entry state.
   * @returns The floor's height, world metres.
   */
  export function floor(body: IAutoMovieMotionHumanBody, entry: IAutoMovieMotionHumanEntryState): number {
    return HumanSupportFrame.floor(body, entry);
  }

  /**
   * Refuse a seat too low to sit on from standing, naming the least height.
   * A seat above the band is not refused: it is a high seat ({@link high}).
   *
   * @param body The body.
   * @param seat The seat.
   * @param under The floor's height under the feet, world metres; the ground's 0 when absent.
   * @throws {HumanRefusal} When the seat height lies below the band.
   */
  export function check(
    body: IAutoMovieMotionHumanBody,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    under: number = 0,
  ): void {
    const r: number = ratio(body, seat, under);
    const least: number = under + RATIO[0] * popliteal(body);
    if (r < RATIO[0])
      throw new HumanRefusal({
        kind: "reach",
        axis: "seat",
        value: seat.at.y,
        feasible: {
          kind: "range",
          minimum: least,
          maximum: null,
          unit: "m",
        },
        reason: `A seat ${(seat.at.y - under).toFixed(3)} m high is ${r.toFixed(2)} of this body's popliteal height; seats from ${(RATIO[0] * popliteal(body)).toFixed(3)} m up suit it`,
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
  export function point(body: IAutoMovieMotionHumanBody, seat: IAutoMovieMotionHumanSeated.ISeat): IAutoMovieVector3 {
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
  export function offset(body: IAutoMovieMotionHumanBody): IAutoMovieVector3 {
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
    body: IAutoMovieMotionHumanBody,
    at: IAutoMovieVector3,
    heading: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll">,
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
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
   * Goals that lay each palm flat on the front of the same thigh, fingers
   * toward the knee, on a posture whose legs are solved first.
   *
   * @param body The body.
   * @param posture The posture with its leg goals.
   * @returns Arm goals.
   */
  export function hands(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, posture),
    );
    const requests: IAutoMovieMotionHumanArmTarget.ISided[] = [];
    for (const side of ["left", "right"] as const) {
      const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
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
      // The hand lies flat along the thigh, its palm on the surface: a
      // relaxed curl would close the fingers into the thigh they lie on.
      requests.push({
        side,
        surface: "palm",
        shape: "flat",
        point,
        rotation: HumanHand.rotation(side, {
          fingers: along,
          palm: Vector3.scale(normal, -1),
        }),
        bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
      });
    }
    const placed: IAutoMovieMotionHumanPosture = handGoals(body, posture, requests);
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0) return posture;
    const onThighs: IAutoMovieMotionHumanPosture["limbs"] = hands(body, posture);
    if (share >= 1)
      return { ...posture, limbs: { ...posture.limbs, ...onThighs } };
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, posture),
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const) {
      const limb: "leftArm" | "rightArm" =
        side === "left" ? "leftArm" : "rightArm";
      const goal: IAutoMovieMotionHumanPosture.IGoal = onThighs[limb]!;
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
   * A seated posture's hands a share of the way from hanging to where they
   * rest: on the armrests of a seat that has them, on the thighs otherwise.
   * A body getting up pushes on its armrests until its seat leaves the
   * seat, as it rests on them sitting down.
   *
   * @param body The body.
   * @param posture The posture with its legs placed and no arm goals.
   * @param rests The seat's armrests, world metres; none when absent.
   * @param yaw The seat's heading, degrees.
   * @param share 0 hanging to 1 resting.
   * @returns The posture with arm goals, or unchanged at 0; a hand on an armrest bears once it is down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where the hands rest and when.
   * @evidence contracts/development/implementation.md#principled-implementation The thighs' rest (`arms`) and the armrests' (`onArmrests`), each the one owner of its placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One choice between two calls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms What the chosen call costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rested(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>> | undefined,
    yaw: number,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    return rests === undefined
      ? arms(body, posture, share)
      : onArmrests(body, arms(body, posture, share), rests, yaw, share);
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>>,
    yaw: number,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0) return posture;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, { ...posture, limbs: legsOnly(posture) }),
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    const s: number = Math.min(1, share);
    for (const side of ["left", "right"] as const) {
      const rest: IAutoMovieVector3 | undefined = rests[side];
      if (rest === undefined) continue;
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const goal: IAutoMovieMotionHumanPosture.IGoal = armrest(body, posture, side, rest, yaw);
      limbs[`${side}Arm`] = {
        point: Vector3.lerp(hand.worldPosition, goal.point, s),
        rotation: Quaternion.slerp(hand.worldRotation, goal.rotation!, s),
        bend: goal.bend,
        planted: s >= 1,
      };
    }
    return { ...posture, limbs };
  }

  /**
   * The goal that rests a hand on its armrest: the wrist a fifth of a hand's
   * length above the rest, the palm down and the fingers ahead along the
   * seat's heading, the hand bearing.
   *
   * @param body The body.
   * @param posture The posture with its legs placed.
   * @param side The hand.
   * @param rest The armrest's point, world metres.
   * @param yaw The seat's heading, degrees.
   * @returns The arm's goal.
   */
  export function armrest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: "left" | "right",
    rest: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieMotionHumanPosture.IGoal {
    return {
      point: { ...rest, y: rest.y + 0.2 * body.measure.hand },
      rotation: HumanHand.rotation(side, {
        fingers: HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          { x: 0, y: 0, z: 1 },
        ),
        palm: { x: 0, y: -1, z: 0 },
      }),
      bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
      planted: true,
    };
  }

  /** A posture's leg goals alone, so its hands are read where its own joints hold them. */
  function legsOnly(posture: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture["limbs"] {
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
  export function popliteal(body: IAutoMovieMotionHumanBody): number {
    return (
      body.measure.ankleHeight + body.measure.shank - body.measure.thighRadius
    );
  }
}

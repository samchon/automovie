import { ANKLE_DORSIFLEXION, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { KnockdownFloor } from "../../reaction/internal/KnockdownFloor";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatFlight } from "./HumanUnseatFlight";
import { heelMountedFoot } from "./heelMountedFoot";

/*
 * The shapes of a rider leaving a saddle (`HumanUnseat`): the slump over the
 * neck, the flight's blend from the carried seat into the lie or the stand, a
 * hand reaching the floor or the mane, the flank clearance a sideways fall must
 * keep, and the drag behind a stirrup. Every angle and time is a provisional
 * stage reading.
 */
export namespace HumanUnseatPose {
  /*
   * Seconds a rider takes to slump over the neck (provisional).
   */
  export const SLUMP: number = 0.8;

  /*
   * Seconds before the landing the falling side's hand meets the floor
   * (provisional).
   */
  export const TOUCH: number = 0.08;

  /*
   * Seconds the dragged body takes from the saddle to its lie behind the
   * stirrup (provisional).
   */
  export const DRAW: number = 0.4;

  /*
   * A standing shape: upright with the joints at rest.
   */
  export const STAND: KnockdownFloor.IFold = { pitch: 0, joints: {} };

  /*
   * The slump's trunk and neck flexion, degrees (provisional).
   */
  const FLEX: Readonly<Record<FLEXEntryItem, number>> = {
    spine: 35,
    chest: 25,
    neck: 30,
  };

  /*
   * The seated posture slumped over the neck by a share.
   * Parameter posture: The carried seat.
   * Parameter share: 0 upright to 1 slumped.
   * Returns: The posture.
   */
  export function slumped(
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0) return posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    for (const [bone, flex] of Object.entries(FLEX) as [
      keyof typeof FLEX,
      number,
    ][]) {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [was[0] + flex * share, was[1], was[2]];
    }
    return { ...posture, joints };
  }

  /*
   * The flying posture: the carried seat blended into a lie or a stand by a
   * share, turned to its facing and placed at the root.
   * Parameter body: The body.
   * Parameter from: The posture at the release.
   * Parameter to: The lie or stand.
   * Parameter facing: The final heading, degrees.
   * Parameter root: The root now.
   * Parameter share: 0 at the release to 1 at the landing.
   * Returns: The posture, its limb goals carried with the root's motion since
   * the release and unplanted: the saddle's holds are let go without a jump.
   */
  export function flying(
    body: IAutoMovieMotionHumanBody,
    from: IAutoMovieMotionHumanPosture,
    to: KnockdownFloor.IFold,
    facing: number,
    root: IAutoMovieVector3,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    const bones: Set<string> = new Set([
      ...Object.keys(from.joints),
      ...Object.keys(to.joints),
    ]);
    for (const bone of bones as Set<
      keyof IAutoMovieMotionHumanPosture["joints"]
    >) {
      const a: readonly [number, number, number] = from.joints[bone] ?? [
        0, 0, 0,
      ];
      const b: readonly [number, number, number] = (
        to.joints as IAutoMovieMotionHumanPosture["joints"]
      )[bone] ?? [0, 0, 0];
      joints[bone] = [
        a[0] + (b[0] - a[0]) * share,
        a[1] + (b[1] - a[1]) * share,
        a[2] + (b[2] - a[2]) * share,
      ];
    }
    const turn: number =
      ((((facing - from.yaw + 180) % 360) + 360) % 360) - 180;
    const shown: IAutoMovieMotionHumanPosture = {
      ...from,
      root,
      yaw: from.yaw + turn * share,
      pitch: from.pitch + (to.pitch - from.pitch) * share,
      roll: from.roll * (1 - share),
      joints,
      limbs: {},
    };
    // The limbs that held the saddle let go but keep their place on the body: each goal is carried by the root's own motion since the release, unplanted, so nothing jumps.
    const carry: IAutoMovieQuaternion = Quaternion.multiply(
      humanPostureHeading(shown),
      Quaternion.inverse(humanPostureHeading(from)),
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const [limb, goal] of Object.entries(from.limbs) as [
      keyof IAutoMovieMotionHumanPosture["limbs"],
      IAutoMovieHumanLimbGoal,
    ][])
      limbs[limb] = {
        ...goal,
        point: Vector3.add(
          root,
          Quaternion.rotateVector(
            carry,
            Vector3.subtract(goal.point, from.root),
          ),
        ),
        bend: Vector3.add(
          root,
          Quaternion.rotateVector(
            carry,
            Vector3.subtract(goal.bend, from.root),
          ),
        ),
        ...(goal.rotation === undefined
          ? {}
          : { rotation: Quaternion.multiply(carry, goal.rotation) }),
        planted: false,
      };
    // A foot let go of its stirrup bears no weight: it turns toes-down about its ball as far as the shank leans past the unloaded dorsiflexion.
    const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
      body,
      shown.root,
      humanPostureHeading(shown),
      shown.joints.hips,
    );
    for (const side of ["left", "right"] as const) {
      const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Leg`];
      if (goal !== undefined)
        limbs[`${side}Leg`] = heelMountedFoot(
          body,
          side,
          goal,
          hips[side],
          ANKLE_DORSIFLEXION.unloaded,
        );
    }
    return { ...shown, limbs };
  }

  /*
   * Where a hand holding nothing hangs: beside the hip, a quarter metre out and
   * a tenth below the root, turned by the posture's heading.
   * Parameter posture: The posture.
   * Parameter side: The hand.
   * Returns: The hand's place, world metres.
   */
  export function hang(
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 {
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(humanPostureHeading(posture), {
        x: (side === "left" ? 1 : -1) * 0.25,
        y: -0.1,
        z: 0,
      }),
    );
  }

  /*
   * A hand reaching for a point by a share: its arm goal moves from where the
   * hand hangs to the point.
   * Parameter posture: The posture.
   * Parameter side: The hand.
   * Parameter point: The point, world metres.
   * Parameter share: 0 hanging to 1 at the point.
   * Returns: The posture with the arm's goal.
   */
  export function reach(
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0) return posture;
    const turn: IAutoMovieQuaternion = humanPostureHeading(posture);
    const sign: number = side === "left" ? 1 : -1;
    // From where the hand is held now, or where it hangs by the hip.
    const hanging: IAutoMovieVector3 =
      posture.limbs[`${side}Arm`]?.point ?? hang(posture, side);
    return {
      ...posture,
      limbs: {
        ...posture.limbs,
        // The new goal keeps only the held goal's elbow point, so the arm does not flip; its contact, turn and limits were the old hold's and do not carry to a new site.
        [`${side}Arm`]: {
          bend:
            posture.limbs[`${side}Arm`]?.bend ??
            Vector3.add(
              hanging,
              Quaternion.rotateVector(turn, { x: sign * 0.3, y: 0, z: -0.3 }),
            ),
          point: Vector3.lerp(hanging, point, share),
          planted: share >= 1,
        },
      },
    };
  }
  /*
   * Where the falling side's hand meets the floor: out from the falling side's
   * shoulder by half the upper arm, below it on the floor.
   * Parameter posture: The posture.
   * Parameter side: The falling side.
   * Parameter body: The body.
   * Returns: World metres, on the floor.
   */
  export function beside(
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieVector3 {
    // Out from the falling side's shoulder, not the hip: the hand comes down past the trunk's side, clear of the thigh.
    const sign: number = side === "left" ? 1 : -1;
    const out: IAutoMovieVector3 = Quaternion.rotateVector(
      humanPostureHeading({ yaw: posture.yaw, pitch: 0, roll: 0 }),
      { x: sign * 0.5 * body.measure.upperArm, y: 0, z: 0 },
    );
    return {
      ...Vector3.add(shoulder(body, posture, side), out),
      y: body.measure.forearmRadius,
    };
  }

  /*
   * The root's height standing.
   * Parameter body: The body.
   * Returns: Metres above the floor.
   */
  export function standingHeight(body: IAutoMovieMotionHumanBody): number {
    return body.measure.hipHeight;
  }

  /*
   * Refuse a sideways fall whose root would cross the carrier's flank below the
   * seat: inside the half width the rider's feet straddle, lower than the
   * seat.
   * Parameter body: The body.
   * Parameter entry: The seated entry posture.
   * Parameter origin: The carrier contact's frame at the act's start.
   * Parameter carrier: The carrier contact's frame reader.
   * Parameter release: The release, film seconds.
   * Parameter flight: The flight.
   * When the flight passes through the flank.
   */
  export function clearsFlank(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
    origin: IAutoMovieRigidTransform,
    carrier: HumanMountedFrame.Reader,
    release: number,
    flight: HumanUnseatFlight.IFlight,
  ): void {
    const local = (
      frame: IAutoMovieRigidTransform,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(point, frame.position),
      );
    const feet: number[] = (["left", "right"] as const)
      .map((side) => entry.limbs[`${side}Leg`]?.point)
      .filter((p): p is IAutoMovieVector3 => p !== undefined)
      .map((p: IAutoMovieVector3): number => Math.abs(local(origin, p).x));
    const flank: number =
      feet.length === 0
        ? body.measure.hipHalfWidth
        : Math.max(...feet) - body.measure.shankRadius;
    for (let k: number = 1; k <= 8; ++k) {
      const t: number = (flight.land * k) / 8;
      const p: IAutoMovieVector3 = local(
        carrier(release + t),
        HumanUnseatFlight.at(flight, t),
      );
      if (Math.abs(p.x) < flank && p.y < 0)
        throw new AutoMovieMotionHumanRefusal({
          kind: "parameter",
          axis: "push",
          value: Vector3.length(flight.push),
          feasible: null,
          reason: `the fall crosses the carrier's flank ${t.toFixed(3)} s after the release`,
          fix: "push the fall harder to the side, or fall backward or forward",
        });
    }
  }

  /*
   * A posture's shoulder joint on a side, where its trunk places it.
   * Parameter body: The body.
   * Parameter posture: The posture.
   * Parameter side: The side.
   * Returns: World metres.
   */
  export function shoulder(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 {
    // The joint where the posture's trunk actually places it, resolved for the upper arm alone, its limbs' goals left out.
    const bone: AutoMovieHumanoidBone = `${side}UpperArm`;
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([bone]);
    return poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        { ...posture, limbs: {} },
        undefined,
        {},
        undefined,
        requested,
      ).pose,
      undefined,
      requested,
    ).get(bone)!.worldPosition;
  }

  /*
   * The first of a span's samples at which a hand's target comes within the
   * arm's reach of its shoulder.
   * Parameter body: The body.
   * Parameter side: The hand.
   * Parameter from: The span's start, local seconds.
   * Parameter to: The span's end, local seconds.
   * Parameter posture: The posture at a local second.
   * Parameter target: The hand's target at a local second, world metres.
   * Returns: The first reachable second, or undefined when none is.
   */
  export function reachable(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    from: number,
    to: number,
    posture: (t: number) => IAutoMovieMotionHumanPosture,
    target: (t: number) => IAutoMovieVector3,
  ): number | undefined {
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm + 0.5 * m.hand;
    for (let k: number = 0; k <= 16; ++k) {
      const t: number = from + ((to - from) * k) / 16;
      if (Vector3.distance(shoulder(body, posture(t), side), target(t)) <= arm)
        return t;
    }
    return undefined;
  }
}

/*
 * The alternatives of `FLEXEntryItem`'s site.
 */
type FLEXEntryItem = "spine" | "chest" | "neck";

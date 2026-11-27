import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHeld,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";

/** World up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * How high a carried crutch's tip lifts as it is moved, metres (provisional, as
 * the crutch walk's).
 */
const LIFT: number = 0.04;

/**
 * The geometry of sitting and rising with two crutches held in one hand : the
 * crutches' grip and tip, a crutch's frame tilted with its tip on the floor, a
 * carried crutch's lifted path, a hand's grip socket, and a crutch's offset in
 * the grip frame of the hand that holds it.
 *
 * A crutch stands on its tip, its shaft along its own `+Y`; the grip lies
 * `length` above the tip.
 */
export namespace crutchSitPath {
  /** A crutch's grip and tip in its own frame. */
  export interface ICrutch {
    /** The grip, in the crutch's frame, metres. */
    grip: IAutoMovieVector3;

    /** The tip, in the crutch's frame, metres. */
    tip: IAutoMovieVector3;

    /** The grip's distance from the tip, metres. */
    length: number;
  }

  /**
   * Read a crutch's grip and tip.
   *
   * @param subject The crutch's subject, for the refusal.
   * @param affordances Its contacts.
   * @returns The crutch.
   * @throws {HumanRefusal} When it declares no grip or no tip.
   */
  export function crutch(
    subject: string,
    affordances: readonly IAutoMovieAffordance[],
  ): ICrutch {
    const find = (id: string): IAutoMovieAffordance | undefined =>
      affordances.find((a: IAutoMovieAffordance): boolean => a.id === id);
    const grip: IAutoMovieAffordance | undefined = find("grip");
    const tip: IAutoMovieAffordance | undefined = find("tip");
    if (grip === undefined || tip === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "crutch",
        value: subject,
        reason: "a crutch declares a grip and a tip",
        fix: "stage crutches with grip and tip contacts",
      });
    return {
      grip: grip.frame.translation,
      tip: tip.frame.translation,
      length: Vector3.distance(grip.frame.translation, tip.frame.translation),
    };
  }

  /**
   * A crutch's frame with its tip on a point and its shaft toward another, its
   * handgrip turned toward a heading: the frame of a crutch tilting as its tip
   * slides along the floor.
   *
   * @param c The crutch.
   * @param tip The tip, world metres.
   * @param toward A point the shaft points to from the tip, world metres.
   * @param forward The level heading the handgrip's axis turns to, world.
   * @returns The crutch's world frame.
   */
  export function slid(
    c: ICrutch,
    tip: IAutoMovieVector3,
    toward: IAutoMovieVector3,
    forward: IAutoMovieVector3,
  ): IAutoMovieRigidTransform {
    const rotation: IAutoMovieQuaternion = HumanHand.align(
      { normal: UP, forward: { x: 0, y: 0, z: 1 } },
      { normal: Vector3.normalize(Vector3.subtract(toward, tip)), forward },
    );
    return {
      position: Vector3.subtract(tip, Quaternion.rotateVector(rotation, c.tip)),
      rotation,
    };
  }

  /**
   * Slide the whole crutch away from a wrist's folded reach limit. The floor
   * plane gives the shortest horizontal displacement with the grip's height
   * unchanged. Keep one contact-disc radius of clearance outside the shell. The
   * integral of the minimum-jerk share eases into that displacement so its
   * first and second derivatives join both ends of the correction band.
   *
   * @param frame The crutch frame on its planted tip.
   * @param shoulder The arm's root in world metres.
   * @param wrist The point that holds the crutch in this frame, world metres.
   * @param outward The level unit direction when the wrist is below the
   *   shoulder.
   * @param minimum The smallest shoulder-to-wrist distance within elbow ROM,
   *   metres.
   * @param disc The unchanged radius of the authored contact disc, metres.
   * @returns The rigid frame with its tip still on the floor.
   */
  export function outsideFold(
    frame: IAutoMovieRigidTransform,
    shoulder: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    outward: IAutoMovieVector3,
    minimum: number,
    disc: number,
  ): IAutoMovieRigidTransform {
    const reach: IAutoMovieVector3 = Vector3.subtract(wrist, shoulder);
    const level: IAutoMovieVector3 = { x: reach.x, y: 0, z: reach.z };
    const horizontal: number = Vector3.length(level);
    const distance: number = Math.hypot(horizontal, reach.y);
    const missing: number = minimum + disc - distance;
    if (missing <= -disc) return frame;
    let growth: number = missing;
    if (missing < disc) {
      const u: number = (missing + disc) / (2 * disc);
      growth = 2 * disc * u ** 4 * (2.5 - 3 * u + u * u);
    }
    const radius: number = distance + growth;
    const spread: number =
      Math.sqrt(Math.max(0, radius * radius - reach.y * reach.y)) - horizontal;
    const direction: IAutoMovieVector3 =
      horizontal === 0 ? outward : Vector3.scale(level, 1 / horizontal);
    return {
      position: Vector3.addScaled(frame.position, direction, spread),
      rotation: frame.rotation,
    };
  }

  /**
   * A carried crutch's frame between two frames: on a minimum-jerk share, its
   * tip lifted `LIFT` at the middle of the move.
   *
   * @param from The frame it leaves.
   * @param to The frame it reaches.
   * @param share The share of the move, 0 to 1.
   * @returns The world frame.
   */
  export function carried(
    from: IAutoMovieRigidTransform,
    to: IAutoMovieRigidTransform,
    share: number,
  ): IAutoMovieRigidTransform {
    const s: number = Math.min(1, Math.max(0, share));
    const blend: number = AutoMovieEngineMotionSampling.minimumJerkShare(s);
    return {
      position: Vector3.add(
        Vector3.lerp(from.position, to.position, blend),
        Vector3.scale(UP, LIFT * AutoMovieEngineMotionSampling.minimumJerkShare(2 * Math.min(s, 1 - s))),
      ),
      rotation: Quaternion.slerp(from.rotation, to.rotation, blend),
    };
  }

  /**
   * A hand's grip socket on a pose, world metres.
   *
   * @param body The body.
   * @param pose The pose.
   * @param side The hand.
   * @returns The grip socket's world point.
   */
  export function socket(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 {
    return HumanHand.frame(
      body,
      poseBones(
        body,
        pose,
        undefined,
        HumanHand.frameBones(body, side, "grip"),
      ),
      side,
      "grip",
    ).point;
  }

  /**
   * A crutch in the grip frame of the hand that closes on its handgrip: the
   * grip socket on the handgrip, the hand turned as it holds a front-to-back
   * bar at its side, the fingers down and the palm in (the suitcase grasp the
   * crutch walk's hands take), with the crutch on its world frame.
   *
   * @param side The hand.
   * @param c The crutch.
   * @param frame The crutch's world frame as the hand closes on it.
   * @param yaw The heading the hand faces, degrees.
   * @param prop The crutch's subject.
   * @param affordances Its contacts.
   * @returns The crutch in the hand's grip frame.
   */
  export function grasped(
    side: AutoMovieHumanSide,
    c: ICrutch,
    frame: IAutoMovieRigidTransform,
    yaw: number,
    prop: string,
    affordances: readonly IAutoMovieAffordance[],
  ): IAutoMovieMotionHumanHeld.IHeld {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      HumanHand.facing(side, yaw, { fingers: "down", palm: "in" }),
    );
    return {
      prop,
      side,
      frame: {
        position: Quaternion.rotateVector(
          inverse,
          Vector3.scale(Quaternion.rotateVector(frame.rotation, c.grip), -1),
        ),
        rotation: Quaternion.normalize(
          Quaternion.multiply(inverse, frame.rotation),
        ),
      },
      affordances,
    };
  }

  /**
   * A prop's offset in the grip frame of a hand, from a pose and the prop's
   * world frame: the offset it keeps once the hand takes it there.
   *
   * @param body The body.
   * @param pose The pose.
   * @param side The hand.
   * @param prop The prop's subject.
   * @param frame The prop's world frame.
   * @param affordances The prop's contacts.
   * @returns The prop in the hand's grip frame.
   */
  export function held(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
    prop: string,
    frame: IAutoMovieRigidTransform,
    affordances: readonly IAutoMovieAffordance[],
  ): IAutoMovieMotionHumanHeld.IHeld {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
      undefined,
      HumanHand.frameBones(body, side, "grip"),
    );
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      bones.get(`${side}Hand`)!.worldRotation,
    );
    return {
      prop,
      side,
      frame: {
        position: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(
            frame.position,
            HumanHand.frame(body, bones, side, "grip").point,
          ),
        ),
        rotation: Quaternion.normalize(
          Quaternion.multiply(inverse, frame.rotation),
        ),
      },
      affordances,
    };
  }
}

import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
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

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";

/** World up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** How high a carried crutch's tip lifts as it is moved, metres (provisional, as the crutch walk's). */
const LIFT: number = 0.04;

/**
 * The geometry of sitting and rising with two crutches held in one hand
 * (#3994): the crutches' grip and tip, a crutch's frame tilted about its
 * planted tip, a carried crutch's lifted path, and a prop's offset in the
 * grip frame of the hand that is about to hold it.
 *
 * A crutch stands on its tip, its shaft along its own `+Y`; the grip lies
 * `length` above the tip. Pivoting on the planted tip, the crutch tilts in
 * the vertical plane of the seat's heading, its top back toward the seated
 * body, so the grip comes down an arc of that radius.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace computes and the crutch's frame.
 * @evidence contracts/development/design.md#principled-representation A crutch is its rigid frame with a grip and a tip; every path is a frame of it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five functions the crutch sit reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The grip's height is the crutch's own contact, never typed.
 */
export namespace crutchSitPath {
  /**
   * A crutch's grip and tip in its own frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The two contacts and the distance between them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the paths read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read from the crutch's own contacts.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, result and refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The two contacts' translations and their distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two lookups and one distance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing contact is refused.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per crutch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * The crutch's frame pivoted on its planted tip by a tilt about a level axis.
   *
   * @param c The crutch.
   * @param tip The planted tip, world metres.
   * @param upright The crutch's rotation standing upright.
   * @param axis The level axis it tilts about, world.
   * @param degrees The tilt, degrees by the right-hand rule about the axis.
   * @returns The crutch's world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, frames and result.
   * @evidence contracts/development/implementation.md#principled-implementation The tilt composes before the upright rotation and the tip stays where it is planted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation and one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact rigid geometry.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pivoted(
    c: ICrutch,
    tip: IAutoMovieVector3,
    upright: IAutoMovieQuaternion,
    axis: IAutoMovieVector3,
    degrees: number,
  ): IAutoMovieRigidTransform {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(Quaternion.fromAxisAngle(axis, degrees), upright),
    );
    return {
      position: Vector3.subtract(tip, Quaternion.rotateVector(rotation, c.tip)),
      rotation,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the lift and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Position and rotation on one minimum-jerk share, the lift a minimum-jerk bump.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lift is the crutch walk's.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function carried(
    from: IAutoMovieRigidTransform,
    to: IAutoMovieRigidTransform,
    share: number,
  ): IAutoMovieRigidTransform {
    const s: number = Math.min(1, Math.max(0, share));
    const blend: number = minimumJerk.share(s);
    return {
      position: Vector3.add(
        Vector3.lerp(from.position, to.position, blend),
        Vector3.scale(UP, LIFT * minimumJerk.share(2 * Math.min(s, 1 - s))),
      ),
      rotation: Quaternion.slerp(from.rotation, to.rotation, blend),
    };
  }

  /**
   * A prop's offset in the grip frame of a hand, from a pose and the prop's world frame: the offset it keeps once the hand takes it there.
   *
   * @param body The body.
   * @param pose The pose.
   * @param side The hand.
   * @param prop The prop's subject.
   * @param frame The prop's world frame.
   * @param affordances The prop's contacts.
   * @returns The prop in the hand's grip frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, frames and result.
   * @evidence contracts/development/implementation.md#principled-implementation The grip frame is the grip socket's point with the hand bone's rotation, as `AutoMovieMotionHumanHeld` reads a held prop.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose read and one inverse transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read on the displayed entry pose.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward kinematics of the hand's chain.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per crutch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

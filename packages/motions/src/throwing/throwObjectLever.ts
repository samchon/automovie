import { type IAutoMovieProjectile, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanHand } from "../posture/HumanHand";
import { StrikingHeld } from "../striking/StrikingHeld";
import { throwObjectLaunch } from "./throwObjectLaunch";

/**
 * The throw's lever: the arm from the shoulder to the hand, lengthened by an
 * implement the hand holds (a sling, an atlatl), turning as one rigid lever
 * at the release (#3490).
 *
 * At the release the lever turns about the shoulder with one angular
 * velocity, so the speed square to it grows with the distance from the
 * shoulder: the implement's working point, `L` beyond the hand along the
 * lever, moves `(r + L) / r` times as fast across the lever as the hand at
 * `r`, while both share the speed along it. The launch velocity is aimed
 * from the working point, and the hand needs only its share: the speed
 * along the lever plus `r / (r + L)` of the speed across it. Through the
 * carry the hand turns at that angular velocity with the implement along
 * the lever, so the working point, and the prop riding it, leave with the
 * launch velocity. With no implement `L` is 0 and the hand carries the
 * launch velocity unturned, the throw as it was.
 *
 * A thrown prop keeps the lever's angular velocity in flight, so a knife's
 * spin (`ITurns`) is the lever's rate, rounded by the act to the nearest
 * whole number of half turns over the flight to the target, at least one,
 * so the stand-off decides how the point arrives ({@link spin}).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the lever's kinematics, the hand's share, the turn through the carry and the spin's choice.
 * @evidence contracts/development/design.md#principled-representation The implement is a held tool's working point (`StrikingHeld`); the lever is its release point, velocities, angular velocity and the hand's turn.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The implement and turns records, the lever, its reading and the spin; read by `throwObject`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No implement's length is stated: it is the held prop's distance from the grip to its named point.
 */
export namespace throwObjectLever {
  /**
   * An implement held in the throwing hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation A held prop and the affordance of its working point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members read by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No implement kind is named; the point is the archetype's affordance id.
   */
  export interface IImplement {
    /** The implement's subject id, held in the throwing hand at the throw's entry. */
    prop: string;

    /** The affordance the thrown prop rides: an atlatl's spur, a sling's pouch. */
    point: string;
  }

  /**
   * A spin the act chooses: the lever's rate rounded to whole half turns
   * over the flight to the target ({@link spin}).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the act derives.
   * @evidence contracts/development/design.md#principled-representation One tag beside the engine's attitudes, resolved to a `spin` before the launch is published.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The tag alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The author types no rate or axis.
   */
  export interface ITurns {
    /** Turns chosen by the act. */
    kind: "turns";
  }

  /**
   * The lever at the release.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation A rigid lever's release state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the throw's plan and the spin read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain vectors, a rate and the hand's turn.
   */
  export interface ILever {
    /** Where the thrown prop leaves: the implement's working point at the release, or the hand's grip without one, world metres. */
    point: IAutoMovieVector3;

    /** The launch velocity there, world metres per second. */
    velocity: IAutoMovieVector3;

    /** The hand grip's velocity at the release, world metres per second. */
    hand: IAutoMovieVector3;

    /** The lever's unit axis of turning, world. */
    axis: IAutoMovieVector3;

    /** The lever's angular speed about `axis`, radians per second. */
    omega: number;

    /** The hand's rotation a second count from the release within the carry. */
    rotation: (carried: number) => IAutoMovieQuaternion;
  }

  /**
   * Read the lever of a throw.
   *
   * @param props The context, the throwing hand, the standing shoulder, the hand's release point, the hand's rotation there, the target, the release angle and the implement.
   * @returns The lever, or undefined when no path at that angle reaches the target from the release point.
   * @throws {HumanRefusal} When the implement lacks the named point (`StrikingHeld.of`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and when there is none.
   * @evidence contracts/development/implementation.md#principled-implementation Rigid lever kinematics about the shoulder: the velocity split along and across the lever, the across part scaled by the radius; the implement's line turned onto the lever by the shortest rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The implement, the release point and its aim, the hand's share, then the turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable target returns undefined for the throw's refusal.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work after one held-tool reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The implement's point is the held-tool reading (`StrikingHeld.of`) and the aim the throw's (`throwObjectLaunch.aimed`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the returned closure.
   */
  export function of(props: {
    context: Pick<IHumanActionContext, "body" | "entry" | "prop" | "subject">;
    side: HumanHand.Side;
    shoulder: IAutoMovieVector3;
    release: IAutoMovieVector3;
    held: IAutoMovieQuaternion;
    target: IAutoMovieVector3;
    degrees: number;
    implement?: IImplement;
  }): ILever | undefined {
    const tip: IAutoMovieVector3 =
      props.implement === undefined
        ? { x: 0, y: 0, z: 0 }
        : StrikingHeld.of(props.context, props.side, props.implement.prop, {
            tip: props.implement.point,
          }).tip;
    const L: number = Vector3.length(tip);
    const radius: IAutoMovieVector3 = Vector3.subtract(
      props.release,
      props.shoulder,
    );
    const r: number = Vector3.length(radius);
    const out: IAutoMovieVector3 = Vector3.normalize(radius);
    const point: IAutoMovieVector3 = Vector3.add(
      props.release,
      Vector3.scale(out, L),
    );
    const velocity: IAutoMovieVector3 | undefined = throwObjectLaunch.aimed(
      point,
      props.target,
      props.degrees,
    );
    if (velocity === undefined) return undefined;

    // The velocity along the lever and across it; the lever turns so the
    // across part is its angular speed times the radius.
    const along: IAutoMovieVector3 = Vector3.scale(
      out,
      Vector3.dot(velocity, out),
    );
    const across: IAutoMovieVector3 = Vector3.subtract(velocity, along);
    const omega: number = Vector3.length(across) / (r + L);
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(out, across),
    );
    const hand: IAutoMovieVector3 = Vector3.add(
      along,
      Vector3.scale(across, r / (r + L)),
    );
    if (props.implement === undefined)
      return {
        point,
        velocity,
        hand,
        axis,
        omega,
        rotation: (): IAutoMovieQuaternion => props.held,
      };

    // The implement laid along the lever by the shortest turn of the hand.
    const line: IAutoMovieVector3 = Quaternion.rotateVector(
      props.held,
      Vector3.normalize(tip),
    );
    const normal: IAutoMovieVector3 = Vector3.cross(line, out);
    const sine: number = Vector3.length(normal);
    const cosine: number = Vector3.dot(line, out);
    const aligned: IAutoMovieQuaternion =
      sine === 0 && cosine > 0
        ? props.held
        : Quaternion.multiply(
            Quaternion.fromAxisAngle(
              sine === 0 ? axis : normal,
              (Math.atan2(sine, cosine) * 180) / Math.PI,
            ),
            props.held,
          );
    return {
      point,
      velocity,
      hand,
      axis,
      omega,
      rotation: (carried: number): IAutoMovieQuaternion =>
        Quaternion.multiply(
          Quaternion.fromAxisAngle(axis, (omega * carried * 180) / Math.PI),
          aligned,
        ),
    };
  }

  /**
   * The spin a thrown prop flies with: the lever's angular speed rounded to
   * the nearest whole number of half turns, at least one, over the
   * drag-free flight's time to the target, about the lever's axis read in
   * the prop's own frame at the release.
   *
   * @param context The action's context.
   * @param side The throwing hand, which holds the prop at the entry.
   * @param prop The thrown prop.
   * @param lever The throw's lever.
   * @param target The target point, world metres.
   * @returns The engine's spin attitude.
   * @throws {HumanRefusal} When that hand does not hold the prop at the entry (`AutoMovieMotionHumanHeld.of`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rate's choice, its flight time and the axis's frame.
   * @evidence contracts/development/implementation.md#principled-implementation A released rigid body keeps its angular velocity; the flight time is the horizontal distance over the constant horizontal speed of the drag-free path the launch is aimed by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The flight time, the half turns, the axis.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rate is derived, never typed; at least one half turn, so a knife always turns.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work after one held reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The prop's grip frame is the held reading (`AutoMovieMotionHumanHeld.of`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function spin(
    context: Pick<IHumanActionContext, "body" | "entry" | "prop" | "subject">,
    side: HumanHand.Side,
    prop: string,
    lever: ILever,
    target: IAutoMovieVector3,
  ): IAutoMovieProjectile.Attitude {
    const seconds: number =
      Math.hypot(target.x - lever.point.x, target.z - lever.point.z) /
      Math.hypot(lever.velocity.x, lever.velocity.z);
    const halves: number = Math.max(
      1,
      Math.round((lever.omega * seconds) / Math.PI),
    );
    const frame: IAutoMovieQuaternion = Quaternion.multiply(
      lever.rotation(0),
      AutoMovieMotionHumanHeld.of(context, side, prop).frame.rotation,
    );
    return {
      kind: "spin",
      axis: Quaternion.rotateVector(Quaternion.inverse(frame), lever.axis),
      rate: (halves * 180) / seconds,
    };
  }
}

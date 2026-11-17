import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanThrowObjectLever, IAutoMovieProjectile, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { StrikingHeld } from "../striking/StrikingHeld";
import { throwObjectLaunch } from "./throwObjectLaunch";

/**
 * The throw's lever: the arm from the shoulder to the hand, lengthened by an
 * implement the hand holds (a sling, an atlatl), turning as one rigid lever
 * at the release (#3490).
 *
 * At the release the arm and the implement move as one rigid body: a
 * velocity shared by every point along the lever from the shoulder to the
 * working point, plus a turn about the shoulder, `v(p) = u + w x (p - s)`.
 * The implement keeps the grip the hand holds it by, so its working point
 * lies where the release's hand rotation puts it (no wrist turn beyond its
 * range is asked), and the launch is aimed from there. The turn is the
 * least one that carries the launch velocity's part square to the line
 * from the shoulder to the working point, `w = (r x v) / |r|^2`, and the
 * shared velocity its part along that line, so the working point leaves
 * with the launch velocity while the hand, nearer the shoulder, moves only
 * as fast as the lever there: the implement's gain. Through the carry the
 * hand turns at `w`. With no implement the working point is the grip, and
 * the hand carries the launch velocity unturned, the throw as it was.
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
   * @evidence contracts/development/implementation.md#principled-implementation Rigid-body kinematics about the shoulder, v(p) = u + w x (p - s): the least turn carrying the velocity's part square to the lever, its part along it shared; the implement where the hand's grip holds it, so no wrist turn is asked.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The implement's point and its aim, the turn and the shared velocity, then the hand's velocity and turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable target returns undefined for the throw's refusal.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work after one held-tool reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The implement's point is the held-tool reading (`StrikingHeld.of`) and the aim the throw's (`throwObjectLaunch.aimed`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the returned closure.
   */
  export function of(props: {
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop" | "subject">;
    side: IAutoMovieMotionHumanHand.Side;
    shoulder: IAutoMovieVector3;
    release: IAutoMovieVector3;
    held: IAutoMovieQuaternion;
    target: IAutoMovieVector3;
    degrees: number;
    implement?: IAutoMovieMotionHumanThrowObjectLever.IImplement;
  }): ILever | undefined {
    const tip: IAutoMovieVector3 =
      props.implement === undefined
        ? { x: 0, y: 0, z: 0 }
        : StrikingHeld.of(props.context, props.side, props.implement.prop, {
            tip: props.implement.point,
          }).tip;

    // The working point where the hand's grip at the release holds it.
    const point: IAutoMovieVector3 = Vector3.add(
      props.release,
      Quaternion.rotateVector(props.held, tip),
    );
    const velocity: IAutoMovieVector3 | undefined = throwObjectLaunch.aimed(
      point,
      props.target,
      props.degrees,
    );
    if (velocity === undefined) return undefined;

    // The least turn about the shoulder that carries the velocity's part
    // square to the lever, w = (r x v) / |r|^2; its part along the lever is
    // the velocity every point of the lever shares.
    const lever: IAutoMovieVector3 = Vector3.subtract(point, props.shoulder);
    const turn: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(lever, velocity),
      1 / Vector3.dot(lever, lever),
    );
    const shared: IAutoMovieVector3 = Vector3.subtract(
      velocity,
      Vector3.cross(turn, lever),
    );
    const omega: number = Vector3.length(turn);
    const axis: IAutoMovieVector3 = Vector3.normalize(turn);
    const hand: IAutoMovieVector3 = Vector3.add(
      shared,
      Vector3.cross(turn, Vector3.subtract(props.release, props.shoulder)),
    );
    return {
      point,
      velocity,
      hand,
      axis,
      omega,
      rotation:
        props.implement === undefined
          ? (): IAutoMovieQuaternion => props.held
          : (carried: number): IAutoMovieQuaternion =>
              Quaternion.multiply(
                Quaternion.fromAxisAngle(
                  axis,
                  (omega * carried * 180) / Math.PI,
                ),
                props.held,
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
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry" | "prop" | "subject">,
    side: IAutoMovieMotionHumanHand.Side,
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

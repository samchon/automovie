import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanThrowObjectLever,
  IAutoMovieProjectile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { throwObjectLaunch } from "../internal/throwObjectLaunch";

/*
 * Read the lever of a throw.
 * Parameter props: The context, the throwing hand, the standing shoulder, the
 * hand's grip at the release, the hand's rotation there, the target, the
 * release angle, the implement and the thrown prop (absent for an empty
 * hand).
 * Returns: The lever, or undefined when no path at that angle reaches the
 * target from the release point.
 * When the implement lacks the named point
 * (`StrikingHeld`).
 */
export function throwObjectLever(
  props: IOfProps,
): throwObjectLever.ILever | undefined {
  // The point that flies, in the hand's grip frame: the implement's
  // working point, else the thrown prop's origin as the hand holds it,
  // else the grip itself.
  const tip: IAutoMovieVector3 =
    props.implement !== undefined
      ? StrikingHeld(props.context, props.side, props.implement.prop, {
          tip: props.implement.point,
        }).tip
      : props.prop !== undefined &&
          props.context.entry.holds[props.side] === props.prop
        ? AutoMovieMotionHumanHeld(props.context, props.side, props.prop).frame
            .position
        : { x: 0, y: 0, z: 0 };

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

  // An unturned hand translates, so it carries the launch velocity itself;
  // an implement's hand moves as the lever does at the grip.
  const hand: IAutoMovieVector3 =
    props.implement === undefined
      ? velocity
      : Vector3.add(
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
              Quaternion.fromAxisAngle(axis, (omega * carried * 180) / Math.PI),
              props.held,
            ),
  };
}

/*
 * The throw's lever: the arm from the shoulder to the hand, lengthened by an
 * implement the hand holds (a sling, an atlatl), turning as one rigid lever at
 * the release.
 *
 * At the release the arm and the implement move as one rigid body: a velocity
 * shared by every point along the lever from the shoulder to the working point,
 * plus a turn about the shoulder, `v(p) = u + w x (p - s)`. The implement keeps
 * the grip the hand holds it by, so its working point lies where the release's
 * hand rotation puts it (no wrist turn beyond its range is asked), and the
 * launch is aimed from there. The turn is the least one that carries the launch
 * velocity's part square to the line from the shoulder to the working point, `w
 * = (r x v) / |r|^2`, and the shared velocity its part along that line, so the
 * working point leaves with the launch velocity while the hand, nearer the
 * shoulder, moves only as fast as the lever there: the implement's gain.
 * Through the carry the hand turns at `w`. With no implement the hand carries
 * the launch velocity unturned, a rigid translation every point of hand and
 * prop shares, and the working point is the point that flies: the thrown prop's
 * own origin where the grip holds it (its rigid offset in the hand's grip
 * frame, `AutoMovieMotionHumanHeld`), the point the performance launches the
 * prop from (`HumanPropFlight`), or the grip for an empty hand. Aiming the grip
 * while the prop's origin flies shifted every landing by that offset.
 *
 * A thrown prop keeps the lever's angular velocity in flight, so a knife's spin
 * (`ITurns`) is the lever's rate, rounded by the act to the nearest whole
 * number of half turns over the flight to the target, at least one, so the
 * stand-off decides how the point arrives (spin).
 */
export namespace throwObjectLever {
  /*
   * The lever at the release.
   */
  export interface ILever {
    /*
     * Where the thrown prop leaves: the implement's working point at the
     * release, the held prop's origin without one, or the hand's grip for an
     * empty hand, world metres.
     */
    point: IAutoMovieVector3;

    /*
     * The launch velocity there, world metres per second.
     */
    velocity: IAutoMovieVector3;

    /*
     * The hand grip's velocity at the release, world metres per second.
     */
    hand: IAutoMovieVector3;

    /*
     * The lever's unit axis of turning, world.
     */
    axis: IAutoMovieVector3;

    /*
     * The lever's angular speed about `axis`, radians per second.
     */
    omega: number;

    /*
     * The hand's rotation a second count from the release within the carry.
     */
    rotation: (carried: number) => IAutoMovieQuaternion;
  }

  /*
   * The spin a thrown prop flies with: the lever's angular speed rounded to the
   * nearest whole number of half turns, at least one, over the drag-free
   * flight's time to the target, about the lever's axis read in the prop's own
   * frame at the release.
   * Parameter context: The action's context.
   * Parameter side: The throwing hand, which holds the prop at the entry.
   * Parameter prop: The thrown prop.
   * Parameter lever: The throw's lever.
   * Parameter target: The target point, world metres.
   * Returns: The engine's spin attitude.
   * When that hand does not hold the prop at the entry
   * (`AutoMovieMotionHumanHeld`).
   */
  export function spin(
    context: Pick<IAutoMovieMotionHumanActionContext, SpinContext>,
    side: AutoMovieHumanSide,
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
      AutoMovieMotionHumanHeld(context, side, prop).frame.rotation,
    );
    return {
      kind: "spin",
      axis: Quaternion.rotateVector(Quaternion.inverse(frame), lever.axis),
      rate: (halves * 180) / seconds,
    };
  }
}

/*
 * The alternatives of `SpinContext`'s site.
 */
type SpinContext = "body" | "entry" | "prop" | "subject";

/*
 * The record of `IOfProps`'s site.
 */
type IOfProps = {
  context: Pick<IAutoMovieMotionHumanActionContext, OfPropsContext>;
  side: AutoMovieHumanSide;
  shoulder: IAutoMovieVector3;
  release: IAutoMovieVector3;
  held: IAutoMovieQuaternion;
  target: IAutoMovieVector3;
  degrees: number;
  implement?: IAutoMovieMotionHumanThrowObjectLever.IImplement;
  prop?: string;
};

/*
 * The alternatives of `OfPropsContext`'s site.
 */
type OfPropsContext = "body" | "entry" | "prop" | "subject";

import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPickUpMoving,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanGrasp } from "./HumanGrasp";

/** The provisional maximum supported conveyor speed, in m/s. */
const maximumSpeed: number = 0.25;

/** The provisional interception horizon bounds the number of frame reads. */
const maximumTime: number = 2;

/** Frame checks are at most one 120 Hz interval apart. */
const samplesPerSecond: number = 120;

/**
 * Resolve a mounted prop's closure frame and incoming translation before planning the grasp.
 *
 * @param context The pickup's action context and displayed prop reader.
 * @param closeAt Seconds from the action's start to closure.
 * @returns The world-space target and its incoming velocity.
 * @throws {HumanRefusal} When the closure, initial mount or sampled conveyor path is unsupported.
 */
export function pickUpIntercept(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUpMoving>,
  closeAt: number,
): {
  /** The grasp, including colliders, at closure. */
  target: IAutoMovieMotionHumanGrasp.ITarget;
  /** Seconds from action time zero to closure. */
  seconds: number;
  /** The support's horizontal velocity in world metres per second. */
  velocity: IAutoMovieVector3;
} {
  /** Report what the authored closure could not intercept. */
  const refuse = (reason: string): never => {
    throw new HumanRefusal({
      kind: "parameter",
      axis: "closeAt",
      value: closeAt,
      reason,
      fix: `set closure within ${maximumTime} s and mount an unheld prop directly on a support translating steadily along the floor at up to ${maximumSpeed} m/s`,
    });
  };
  if (
    !(closeAt > 0) ||
    !(closeAt <= maximumTime) ||
    !Number.isFinite(context.start + closeAt) ||
    !(context.start + closeAt > context.start)
  )
    return refuse(
      `the closure must be in (0, ${maximumTime}] s after the pickup starts`,
    );

  const prop: IAutoMovieMotionHumanPropReader = context.prop(
    context.params.prop,
  );
  const mount: IAutoMovieMotionHumanProp.IMounted | undefined =
    prop.prop.mounted;
  if (
    mount === undefined ||
    Object.values(context.entry.holds).includes(prop.prop.subject)
  )
    return refuse(
      "interception requires a prop on its initial mount with neither hand already holding it",
    );
  const support: IAutoMovieMotionHumanPropReader = context.prop(mount.prop);
  const socket: IAutoMovieAffordance | undefined =
    support.prop.affordances?.find(
      (affordance: IAutoMovieAffordance): boolean =>
        affordance.id === mount.point,
    );
  if (
    socket === undefined ||
    support.prop.motion === undefined ||
    support.prop.articulate !== undefined
  )
    return refuse(
      "interception requires a rigid socket on a directly driven support",
    );

  // Keep the mount's local transform once. A detached object can still carry
  // an initial mount declaration, but its displayed frame no longer follows it.
  const localPosition: IAutoMovieVector3 = Vector3.add(
    socket.frame.translation,
    Quaternion.rotateVector(socket.frame.rotation, mount.offset.position),
  );
  const localRotation: IAutoMovieRigidTransform["rotation"] =
    Quaternion.multiply(socket.frame.rotation, mount.offset.rotation);

  const from: IAutoMovieRigidTransform = prop.frame(context.start);
  const to: IAutoMovieRigidTransform = prop.frame(context.start + closeAt);
  const delta: IAutoMovieVector3 = Vector3.subtract(to.position, from.position);
  const velocity: IAutoMovieVector3 = Vector3.scale(delta, 1 / closeAt);

  // This variant covers a slow conveyor with a constant horizontal course.
  // The speed cap and frame tolerance are provisional domain bounds.
  const tolerance: number = 1e-6;
  if (
    !(
      Math.abs(velocity.y) <= tolerance &&
      Vector3.length(velocity) > tolerance &&
      Vector3.length(velocity) <= maximumSpeed + tolerance
    )
  )
    refuse(
      "the mounted prop's translation exceeds the horizontal conveyor bounds",
    );
  // The callback authors a first-degree translation and constant rotation.
  // Samples check that premise at frame resolution; the velocity retains its
  // signed world direction so either direction along the belt is supported.
  const intervals: number = Math.ceil(closeAt * samplesPerSecond);
  for (let i: number = 0; i <= intervals; ++i) {
    const share: number = i / intervals;
    const seconds: number = context.start + closeAt * share;
    const sample: IAutoMovieRigidTransform =
      i === 0 ? from : i === intervals ? to : prop.frame(seconds);
    const carrier: IAutoMovieRigidTransform = support.frame(seconds);
    if (
      !(
        Quaternion.angle(
          sample.rotation,
          Quaternion.multiply(carrier.rotation, localRotation),
        ) <= tolerance &&
        Vector3.length(
          Vector3.subtract(
            sample.position,
            Vector3.add(
              carrier.position,
              Quaternion.rotateVector(carrier.rotation, localPosition),
            ),
          ),
        ) <= tolerance
      )
    )
      refuse(
        "the prop's displayed frame does not follow its initial mount through closure",
      );
    if (
      !(
        Quaternion.angle(from.rotation, sample.rotation) <= tolerance &&
        Vector3.length(
          Vector3.subtract(
            sample.position,
            Vector3.add(from.position, Vector3.scale(delta, share)),
          ),
        ) <= tolerance
      )
    )
      refuse(
        "the mounted prop's sampled frames turn or depart from uniform translation",
      );
  }
  return {
    target: HumanGrasp.at(prop.prop, context.params.handle, to),
    seconds: closeAt,
    velocity: { ...velocity, y: 0 },
  };
}

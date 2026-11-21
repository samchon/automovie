import { Quaternion, Vector3, physicalShapeBounds } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/**
 * How a displayed body meets the floor: whether any collider sinks below it,
 * and whether a foot declared planted stays where it stands and on the floor.
 *
 * The floor is the floor under the person (`AutoMovieMotionHumanAuditMotion.floors`):
 * the ground their bearing contacts declare, none while a prop, a person or
 * the water bears them. A planted foot rolls through the
 * rockers of stance (Perry and Burnfield, Gait Analysis, 2nd ed.): on its
 * heel, flat, then on its ball and its toe pad, so its contact at an instant
 * is its lowest sole socket, the heel winning a tie within a micrometre and
 * then the ball, which keeps a flat foot from flickering between sockets. A
 * socket that is not the lowest is lifted and free to travel. A plant window
 * is read at its two ends and at the motion's own grid instants between
 * them, the poses the other checks read as well. Slip is the
 * contact's horizontal distance from where that socket first was the contact
 * in the same plant window, that place held in the frame of the window's
 * support (`IAutoMovieMotionHumanAuditMotion.support`), so a foot planted on a
 * moving deck or tread is carried with it and only its travel on the support
 * counts; lift is the contact's distance from its declared
 * stationary surface, such as the world floor or a stair tread.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the floor, the contact rule with its source and what each reading measures.
 * @evidence contracts/development/implementation.md#principled-implementation Exact collider bounds from the engine's shape owner, and the sole sockets from `HumanFoot.sockets`, the one place that puts them on displayed bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three readings over one grid, the two foot readings sharing one window walk.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed bones, never a law's goals; no foot or window is exempt.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames times shapes; a plant window adds at most its two ends to the poses of the motion's grid.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the motion handed in.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditGround {
  /**
   * The deepest any collider sinks below the floor over the motion.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param rate Grid samples per second.
   * @returns Metres below the floor (zero when nothing sinks), with the bone that sinks.
   */
  export function floor(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    let worst: IAutoMovieMotionHumanAuditMeasure = {
      value: 0,
      seconds: 0,
      where: "none",
    };
    const under: (seconds: number) => number | null = HumanAuditMotion.floors(
      motion,
      subject,
    );
    for (const t of HumanAuditMotion.grid(0, motion.duration, rate)) {
      const floor: number | null = under(t);
      if (floor === null) continue;
      for (const { bone, pose, shapes } of HumanColliders.placed(
        body,
        motion.bones(subject, t),
      ))
        for (const shape of shapes) {
          const depth: number = floor - physicalShapeBounds(pose, shape).min.y;
          if (depth > worst.value)
            worst = { value: depth, seconds: t, where: bone };
        }
    }
    return worst;
  }

  /**
   * The largest slip of a planted foot within any of its plant windows.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param rate Grid samples per second.
   * @returns Metres, with the action and the foot.
   */
  export function slip(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    return plants(motion, subject, body, rate, false);
  }

  /**
   * The farthest a foot is above or below its declared stationary surface
   * within any of its plant windows.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param rate Grid samples per second.
   * @returns Metres, with the action and the foot.
   */
  export function lift(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    return plants(motion, subject, body, rate, true);
  }
}

/** The worst slip, or the worst height off the floor, over every foot plant window. */
const plants = (
  motion: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  body: IAutoMovieMotionHumanBody,
  rate: number,
  height: boolean,
): IAutoMovieMotionHumanAuditMeasure => {
  let worst: IAutoMovieMotionHumanAuditMeasure = {
    value: 0,
    seconds: 0,
    where: "none",
  };
  const frames: number[] = HumanAuditMotion.grid(0, motion.duration, rate);
  for (const window of HumanAuditMotion.windows(motion, subject)) {
    const part: string = window.contact.part;
    if (
      window.contact.kind !== "plant" ||
      (part !== "leftFoot" && part !== "rightFoot")
    )
      continue;
    const surface: IAutoMovieMotionHumanContactWindow.Support =
      window.contact.support;
    if (height && surface.kind !== "ground") continue;
    const elevation: number =
      surface.kind === "ground" ? (surface.height ?? 0) : 0;
    // Slip is read in the support's frame: each anchor is kept in it.
    const anchors:
      | Map<IAutoMovieMotionHumanFoot.Socket, IAutoMovieVector3>
      | undefined = height ? undefined : new Map();
    const frame = (seconds: number): IAutoMovieRigidTransform | null =>
      surface.kind === "ground" || motion.support === undefined
        ? null
        : motion.support(surface, seconds);
    for (const t of [
      window.from,
      ...frames.filter(
        (f: number): boolean => f > window.from && f < window.to,
      ),
      ...(window.to > window.from ? [window.to] : []),
    ]) {
      const sole: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
        body,
        motion.bones(subject, t),
        part === "leftFoot" ? "left" : "right",
      );
      let contact: IAutoMovieMotionHumanFoot.ISocket = sole[0]!;
      for (const socket of sole)
        if (socket.point.y < contact.point.y - 1e-6) contact = socket;
      let value: number = Math.abs(contact.point.y - elevation);
      if (anchors !== undefined) {
        const carrier: IAutoMovieRigidTransform | null = frame(t);
        const local: IAutoMovieVector3 =
          carrier === null
            ? contact.point
            : Quaternion.rotateVector(
                Quaternion.inverse(carrier.rotation),
                Vector3.subtract(contact.point, carrier.position),
              );
        const anchor: IAutoMovieVector3 = anchors.get(contact.socket) ?? local;
        anchors.set(contact.socket, anchor);
        const held: IAutoMovieVector3 =
          carrier === null
            ? anchor
            : Vector3.add(
                carrier.position,
                Quaternion.rotateVector(carrier.rotation, anchor),
              );
        value = Math.hypot(contact.point.x - held.x, contact.point.z - held.z);
      }
      if (value > worst.value)
        worst = { value, seconds: t, where: `${window.action} ${part}` };
    }
  }
  return worst;
};

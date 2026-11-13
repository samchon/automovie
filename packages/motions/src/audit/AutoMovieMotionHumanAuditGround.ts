import { physicalShapeBounds } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * How a displayed body meets the floor: whether any collider sinks below it,
 * and whether a foot declared planted stays where it stands and on the floor.
 *
 * The floor is the world plane `y = 0`. A planted foot rolls through the
 * rockers of stance (Perry and Burnfield, Gait Analysis, 2nd ed.): on its
 * heel, flat, then on its ball and its toe pad, so its contact at an instant
 * is its lowest sole socket, the heel winning a tie within a micrometre and
 * then the ball, which keeps a flat foot from flickering between sockets. A
 * socket that is not the lowest is lifted and free to travel. A plant window
 * is read at its two ends and at the motion's own grid instants between
 * them, the poses the other checks read as well. Slip is the
 * contact's horizontal distance from where that socket first was the contact
 * in the same plant window; lift is the contact's height off the floor, read
 * only for a plant whose support is the ground (a plant on a step or a prop
 * stands at that support's height).
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
    body: IHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    let worst: IAutoMovieMotionHumanAuditMeasure = {
      value: 0,
      seconds: 0,
      where: "none",
    };
    for (const t of IAutoMovieMotionHumanAuditMotion.grid(
      0,
      motion.duration,
      rate,
    ))
      for (const { bone, pose, shapes } of HumanColliders.placed(
        body,
        motion.bones(subject, t),
      ))
        for (const shape of shapes) {
          const depth: number = -physicalShapeBounds(pose, shape).min.y;
          if (depth > worst.value)
            worst = { value: depth, seconds: t, where: bone };
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
    body: IHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    return plants(motion, subject, body, rate, false);
  }

  /**
   * The farthest a foot planted on the ground is from the floor, above or
   * below, within any of its plant windows.
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
    body: IHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    return plants(motion, subject, body, rate, true);
  }
}

/** The worst slip, or the worst height off the floor, over every foot plant window. */
const plants = (
  motion: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  body: IHumanBody,
  rate: number,
  height: boolean,
): IAutoMovieMotionHumanAuditMeasure => {
  let worst: IAutoMovieMotionHumanAuditMeasure = {
    value: 0,
    seconds: 0,
    where: "none",
  };
  const frames: number[] = IAutoMovieMotionHumanAuditMotion.grid(
    0,
    motion.duration,
    rate,
  );
  for (const window of IAutoMovieMotionHumanAuditMotion.windows(
    motion,
    subject,
  )) {
    const part: string = window.contact.part;
    if (
      window.contact.kind !== "plant" ||
      (part !== "leftFoot" && part !== "rightFoot")
    )
      continue;
    if (height && window.contact.support.kind !== "ground") continue;
    const anchors: Map<HumanFoot.Socket, IAutoMovieVector3> = new Map();
    for (const t of [
      window.from,
      ...frames.filter(
        (f: number): boolean => f > window.from && f < window.to,
      ),
      ...(window.to > window.from ? [window.to] : []),
    ]) {
      const sole: HumanFoot.ISocket[] = HumanFoot.sockets(
        body,
        motion.bones(subject, t),
        part === "leftFoot" ? "left" : "right",
      );
      let contact: HumanFoot.ISocket = sole[0]!;
      for (const socket of sole)
        if (socket.point.y < contact.point.y - 1e-6) contact = socket;
      const anchor: IAutoMovieVector3 =
        anchors.get(contact.socket) ?? contact.point;
      anchors.set(contact.socket, anchor);
      const value: number = height
        ? Math.abs(contact.point.y)
        : Math.hypot(contact.point.x - anchor.x, contact.point.z - anchor.z);
      if (value > worst.value)
        worst = { value, seconds: t, where: `${window.action} ${part}` };
    }
  }
  return worst;
};

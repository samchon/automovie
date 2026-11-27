import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/*
 * How a displayed body meets the floor: whether any collider sinks below it,
 * and whether a foot declared planted stays where it stands and on the floor.
 *
 * The floor is the floor under the person
 * (`AutoMovieMotionHumanAuditMotion.floors`): the ground their bearing contacts
 * declare, none while a prop, a person or the water bears them; a leg is read
 * against the floor under its own foot
 * (`AutoMovieMotionHumanAuditMotion.feet`), so a person on two treads has one
 * leg over each. A planted foot rolls through the rockers of stance (Perry and
 * Burnfield, Gait Analysis, 2nd ed.): on its heel, flat, then on its ball and
 * its toe pad, so its contact at an instant is its lowest sole socket, the heel
 * winning a tie within a micrometre and then the ball, which keeps a flat foot
 * from flickering between sockets. A socket that is not the lowest is lifted
 * and free to travel. A window that declares the point its law holds
 * (`IAutoMovieMotionHumanContactWindow.socket`: the ball a heel rises about, or
 * the leg goal's own contact) is read at that point throughout instead, so the
 * toe tip rolling under a held ball is not a slip, and a held ball that slides
 * is. A plant window is read at its two ends and at the motion's own grid
 * instants between them, the poses the other checks read as well. Slip is the
 * contact's horizontal distance from where that socket first was the contact in
 * the same plant window, that place held in the frame of the window's support
 * (`IAutoMovieMotionHumanAuditMotion.support`), so a foot planted on a moving
 * deck or tread is carried with it and only its travel on the support counts;
 * lift is the contact's distance from its declared stationary surface, such as
 * the world floor or a stair tread.
 */
export namespace AutoMovieMotionHumanAuditGround {
  /*
   * The deepest any collider sinks below the floor over the motion.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Parameter body: Their body.
   * Parameter rate: Grid samples per second.
   * Returns: Metres below the floor (zero when nothing sinks), with the bone
   * that sinks.
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
    // A leg is read against the floor under its own foot, the rest of the
    // body against the floor under the person: a person on two treads has
    // one leg over each.
    const legs: Record<AutoMovieHumanSide, (seconds: number) => number | null> =
      {
        left: HumanAuditMotion.feet(motion, subject, "left"),
        right: HumanAuditMotion.feet(motion, subject, "right"),
      };
    for (const t of HumanAuditMotion.grid(0, motion.duration, rate)) {
      const floor: number | null = under(t);
      if (floor === null) continue;
      const leg: Record<AutoMovieHumanSide, number | null> = {
        left: legs.left(t),
        right: legs.right(t),
      };
      for (const { bone, pose, shapes } of HumanColliders.placed(
        body,
        motion.bones(subject, t),
      ))
        for (const shape of shapes) {
          const side: AutoMovieHumanSide | undefined = LEG.test(bone)
            ? bone.startsWith("left")
              ? "left"
              : "right"
            : undefined;
          const level: number | null = side === undefined ? floor : leg[side];
          if (level === null) continue;
          const depth: number = level - AutoMovieEnginePhysics.physicalShapeBounds(pose, shape).min.y;
          if (depth > worst.value)
            worst = { value: depth, seconds: t, where: bone };
        }
    }
    return worst;
  }

  /*
   * The largest slip of a planted foot within any of its plant windows.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Parameter body: Their body.
   * Parameter rate: Grid samples per second.
   * Returns: Metres, with the action and the foot.
   */
  export function slip(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    return plants(motion, subject, body, rate, false);
  }

  /*
   * The farthest a foot is above or below its declared stationary surface
   * within any of its plant windows.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Parameter body: Their body.
   * Parameter rate: Grid samples per second.
   * Returns: Metres, with the action and the foot.
   */
  export function lift(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    return plants(motion, subject, body, rate, true);
  }

  /*
   * A planted foot's contact at an instant: the point its window declares held
   * (`IAutoMovieMotionHumanContactWindow.socket`), a named sole socket or a
   * rest-frame point placed by the displayed foot bone, else its lowest sole
   * socket, the heel winning a tie within a micrometre and then the ball.
   * Parameter body: The body.
   * Parameter bones: The displayed bones at the instant.
   * Parameter side: The foot.
   * Parameter declared: The window's held point; none when absent.
   * Returns: The contact, keyed by which point it is.
   */
  export function held(
    body: IAutoMovieMotionHumanBody,
    bones: ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]>,
    side: AutoMovieHumanSide,
    declared: IAutoMovieMotionHumanContactWindow.Socket | undefined,
  ): IHeld {
    if (declared !== undefined && typeof declared !== "string") {
      const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      return {
        key: "contact",
        point: AutoMovieEngineVector3.add(
          foot.worldPosition,
          AutoMovieEngineQuaternion.rotateVector(foot.worldRotation, declared),
        ),
      };
    }
    const sole: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      bones,
      side,
    );
    let contact: IAutoMovieMotionHumanFoot.ISocket = sole[0]!;
    if (declared !== undefined)
      contact = sole.find(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          socket.socket === declared,
      )!;
    else
      for (const socket of sole)
        if (socket.point.y < contact.point.y - 1e-6) contact = socket;
    return { key: contact.socket, point: contact.point };
  }

  /*
   * A planted foot's contact point at an instant, keyed by which point it is.
   */
  export interface IHeld {
    /*
     * The socket's name, or `contact` for a declared rest-frame point.
     */
    key: string;

    /*
     * Where it is, world metres.
     */
    point: IAutoMovieVector3;
  }
}

/*
 * The bones of a leg, thigh to toes, which the floor under their own foot
 * bears.
 */
const LEG: RegExp = /^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/;

/*
 * The worst slip, or the worst height off the floor, over every foot plant
 * window.
 */
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
    const anchors: Map<string, IAutoMovieVector3> | undefined = height
      ? undefined
      : new Map();
    const declared: IAutoMovieMotionHumanContactWindow.Socket | undefined =
      window.contact.socket;
    const side: AutoMovieHumanSide = part === "leftFoot" ? "left" : "right";
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
      const bones: ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> =
        motion.bones(subject, t);
      const contact: AutoMovieMotionHumanAuditGround.IHeld =
        AutoMovieMotionHumanAuditGround.held(body, bones, side, declared);
      let value: number = Math.abs(contact.point.y - elevation);
      if (anchors !== undefined) {
        const carrier: IAutoMovieRigidTransform | null = frame(t);
        const local: IAutoMovieVector3 =
          carrier === null
            ? contact.point
            : AutoMovieEngineQuaternion.rotateVector(
                AutoMovieEngineQuaternion.inverse(carrier.rotation),
                AutoMovieEngineVector3.subtract(contact.point, carrier.position),
              );
        const anchor: IAutoMovieVector3 = anchors.get(contact.key) ?? local;
        anchors.set(contact.key, anchor);
        const held: IAutoMovieVector3 =
          carrier === null
            ? anchor
            : AutoMovieEngineVector3.add(
                carrier.position,
                AutoMovieEngineQuaternion.rotateVector(carrier.rotation, anchor),
              );
        value = Math.hypot(contact.point.x - held.x, contact.point.z - held.z);
      }
      if (value > worst.value)
        worst = { value, seconds: t, where: `${window.action} ${part}` };
    }
  }
  return worst;
};

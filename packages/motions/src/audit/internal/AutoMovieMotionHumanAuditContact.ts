import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditContact,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { AutoMovieMotionHumanAuditGround } from "./AutoMovieMotionHumanAuditGround";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/**
 * Whether the feet's contact with the floor, inferred from the displayed motion
 * itself, agrees with the contact the actions declare.
 *
 * The slip and lift readings of the ground audit look only inside declared
 * plant windows, so a foot that skates along the floor while no window is
 * declared on it goes unread. This reading infers contact the way gait analysis
 * does from kinematics alone: a sole socket (heel, ball or toe) is on the floor
 * while it is no higher than {@link HEIGHT} above the floor under that foot
 * (`AutoMovieMotionHumanAuditMotion.feet`; where none is, in water or on a
 * saddle, no step is read for a skate), and a socket on the floor is at rest
 * while its horizontal speed is no more than {@link SPEED}. Each step between
 * two grid instants is then read twice, `skate` and `loose` in metres per
 * second and `afloat` in metres:
 *
 * - `skate`: outside every window declared on the foot, a socket on the floor at
 *   both ends of the step travels horizontally: a foot dragged or skated along
 *   the floor. `share` is the part of the film's steps in which some socket
 *   does so faster than `SPEED`.
 * - `loose` and `afloat`: inside a plant window, the point the window declares
 *   held (`IAutoMovieMotionHumanContactWindow.socket`), else the foot's lowest
 *   socket, must be the contact: `loose` is its horizontal speed in the frame
 *   of the window's support (`IAutoMovieMotionHumanAuditMotion.support`; a deck
 *   or a saddle carries a planted foot) while the same socket stays the lowest,
 *   and, on the ground, `afloat` its height off the floor.
 *
 * A window of any kind declared on a foot (a plant, a pivot, a strike) declares
 * its contact, so only steps wholly outside all of them are read for `skate`: a
 * step a window's edge falls inside, between two grid instants, is partly
 * declared and is not read.
 */
export namespace AutoMovieMotionHumanAuditContact {
  /**
   * The height under which a sole socket is on the floor, metres: the foot's
   * own bearing height (`HumanFoot.BEARING`), under half the 12.9 mm mean
   * minimum toe clearance of the swinging foot in normal walking (Winter 1992,
   * Foot trajectory in human gait, Physical Therapy 72(1):45-53), so a foot at
   * the lowest point of a normal swing is not read as on the floor.
   */
  export const HEIGHT: number = HumanFoot.BEARING;

  /**
   * The horizontal speed under which a socket on the floor is at rest, metres
   * per second: the 50 mm/s marker speed threshold that detects foot contact in
   * barefoot walking (Ghoussayni, Stevens, Durham and Ewins 2004, Assessment
   * and validation of a simple automated method for the detection of gait
   * events and intervals, Gait and Posture 20(3):266-272).
   */
  export const SPEED: number = 0.05;

  /**
   * Read one person's feet over a motion.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param rate Grid samples per second.
   * @returns The readings.
   * @throws {Error} When the rate is not positive.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditContact.IResult {
    const none = (): IAutoMovieMotionHumanAuditMeasure => ({
      value: 0,
      seconds: 0,
      where: "none",
    });
    const out: IAutoMovieMotionHumanAuditContact.IResult = {
      skate: none(),
      share: 0,
      loose: none(),
      afloat: none(),
    };
    const frames: number[] = HumanAuditMotion.grid(0, motion.duration, rate);
    const windows: IAutoMovieMotionHumanAuditMotion.IWindow[] =
      HumanAuditMotion.windows(motion, subject);
    const skated: boolean[] = frames.map((): boolean => false);
    // A socket's point in a support's frame at an instant: the world point
    // itself on the ground or on a motion that moves no support.
    const local = (
      support: IAutoMovieMotionHumanContactWindow.Support,
      seconds: number,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      if (support.kind === "ground" || motion.support === undefined)
        return point;
      const frame: IAutoMovieRigidTransform = motion.support(support, seconds);
      return Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(point, frame.position),
      );
    };
    for (const side of ["left", "right"] as const) {
      const part: MeasurePart = `${side}Foot`;
      // Each foot is read against the floor under it, so a foot on one
      // tread is not read against the other foot's.
      const floors: (number | null)[] = frames.map(
        HumanAuditMotion.feet(motion, subject, side),
      );
      const declared: IAutoMovieMotionHumanAuditMotion.IWindow[] =
        windows.filter(
          (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
            w.contact.part === part,
        );
      // The support a foot is carried by at an instant: the one its bearing
      // window declares there, else the one its last bearing window ended
      // on, so a foot that rides a tread or a deck between its windows is
      // read on that support, never against a floor it is level with.
      const carriers: IAutoMovieMotionHumanAuditMotion.IWindow[] =
        declared.filter(
          (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
            w.contact.kind !== "grip" && w.contact.kind !== "strike",
        );
      const carrier = (
        seconds: number,
      ): IAutoMovieMotionHumanContactWindow.Support => {
        let found: IAutoMovieMotionHumanAuditMotion.IWindow | undefined;
        for (const w of carriers)
          if (
            w.from <= seconds + 1e-9 &&
            (found === undefined || w.to >= found.to)
          )
            found = w;
        return found?.contact.support ?? GROUND;
      };
      let before: IAutoMovieMotionHumanFoot.ISocket[] | null = null;
      let previous: ReturnType<
        IAutoMovieMotionHumanAuditMotion["bones"]
      > | null = null;
      for (let i: number = 0; i < frames.length; i++) {
        const t: number = frames[i]!;
        const bones: ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> =
          motion.bones(subject, t);
        const sole: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
          body,
          bones,
          side,
        );
        const holding: IAutoMovieMotionHumanAuditMotion.IWindow[] =
          before === null
            ? []
            : declared.filter(
                (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
                  w.from <= frames[i - 1]! + 1e-9 && t <= w.to + 1e-9,
              );
        const span: number = before === null ? 0 : t - frames[i - 1]!;
        if (before !== null && span > 1e-9) {
          const height = (socket: IAutoMovieMotionHumanFoot.ISocket): number =>
            before!.find(
              (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
                s.socket === socket.socket,
            )!.point.y;
          // A step read for a skate lies wholly outside every window on the
          // foot: one a window's end or start falls inside is partly
          // declared, wherever the window falls between two instants.
          const floor: number | null = floors[i]!;
          const was: number | null = floors[i - 1]!;
          if (
            floor !== null &&
            was !== null &&
            !declared.some(
              (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
                w.from < t - 1e-9 && w.to > frames[i - 1]! + 1e-9,
            )
          )
            for (const socket of sole) {
              if (
                socket.point.y - floor > HEIGHT ||
                height(socket) - was > HEIGHT
              )
                continue;
              const on: IAutoMovieMotionHumanContactWindow.Support = carrier(
                frames[i - 1]!,
              );
              const then: IAutoMovieVector3 = local(
                on,
                frames[i - 1]!,
                before!.find(
                  (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
                    s.socket === socket.socket,
                )!.point,
              );
              const now: IAutoMovieVector3 = local(on, t, socket.point);
              const v: number =
                Math.hypot(now.x - then.x, now.z - then.z) / span;
              if (v > SPEED) skated[i] = true;
              if (v > out.skate.value)
                out.skate = {
                  value: v,
                  seconds: t,
                  where: `${part} ${socket.socket}`,
                };
            }
          for (const window of holding) {
            if (window.contact.kind !== "plant") continue;
            const support: IAutoMovieMotionHumanContactWindow.Support =
              window.contact.support;
            const where: string = `${window.action} ${part}`;
            // The point the window declares held, else the lowest socket.
            const declared:
              | IAutoMovieMotionHumanContactWindow.Socket
              | undefined = window.contact.socket;
            const low: AutoMovieMotionHumanAuditGround.IHeld =
              AutoMovieMotionHumanAuditGround.held(body, bones, side, declared);
            if (support.kind === "ground") {
              const above: number = low.point.y - (support.height ?? 0);
              if (above > out.afloat.value)
                out.afloat = { value: above, seconds: t, where };
            }
            const prior: AutoMovieMotionHumanAuditGround.IHeld =
              AutoMovieMotionHumanAuditGround.held(
                body,
                previous!,
                side,
                declared,
              );
            if (prior.key !== low.key) continue;
            const now: IAutoMovieVector3 = local(support, t, low.point);
            const then: IAutoMovieVector3 = local(
              support,
              frames[i - 1]!,
              prior.point,
            );
            const v: number = Math.hypot(now.x - then.x, now.z - then.z) / span;
            if (v > out.loose.value)
              out.loose = { value: v, seconds: t, where };
          }
        }
        before = sole;
        previous = bones;
      }
    }
    out.share =
      frames.length < 2
        ? 0
        : skated.filter((s: boolean): boolean => s).length /
          (frames.length - 1);
    return out;
  }
}

/** The alternatives of `MeasurePart`'s site. */
type MeasurePart = "leftFoot" | "rightFoot";

/** The world floor, the support of a foot that no window has declared one for. */
const GROUND: IAutoMovieMotionHumanContactWindow.Support = { kind: "ground" };

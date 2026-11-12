import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * Whether the feet's contact with the floor, inferred from the displayed
 * motion itself, agrees with the contact the actions declare.
 *
 * The slip and lift readings of the ground audit look only inside declared
 * plant windows, so a foot that skates along the floor while no window is
 * declared on it goes unread. This reading infers contact the way gait
 * analysis does from kinematics alone: a sole socket (heel, ball or toe) is
 * on the floor while it is no higher than {@link HEIGHT}, and a socket on the
 * floor is at rest while its horizontal speed is no more than {@link SPEED}.
 * Each step between two grid instants is then read twice:
 *
 * - `skate`: outside every window declared on the foot, a socket on the
 *   floor at both ends of the step travels horizontally: a foot dragged or
 *   skated along the floor. `share` is the part of the film's steps in which
 *   some socket does so faster than `SPEED`.
 * - `loose` and `afloat`: inside a plant window on the ground, the foot's
 *   lowest socket must be the contact: `loose` is its horizontal speed while
 *   the same socket stays the lowest, and `afloat` its height off the floor.
 *
 * A window of any kind declared on a foot (a plant, a pivot, a strike)
 * declares its contact, so only steps wholly outside all of them are read
 * for `skate`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the gap it closes, how contact is inferred with each threshold's source, and what each reading means.
 * @evidence contracts/development/implementation.md#principled-implementation Kinematic contact inference by a height and a speed threshold on the sole's own sockets, compared with the declared windows.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk over the grid's steps, each socket read once per step.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed bones, never a law's goals; no foot, action or window is exempt.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames: two feet of three sockets per instant.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the motion handed in; the sockets come from `HumanFoot.sockets`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditContact {
  /**
   * The height under which a sole socket is on the floor, metres: under half
   * the 12.9 mm mean minimum toe clearance of the swinging foot in normal
   * walking (Winter 1992, Foot trajectory in human gait, Physical Therapy
   * 72(1):45-53), so a foot at the lowest point of a normal swing is not
   * read as on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the source and why the bound sits where it does.
   * @evidence contracts/development/design.md#principled-representation One length compared with a socket's height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by this audit and by the tests that set a film at its two sides.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Derived from a measured clearance, not tuned to a motion.
   */
  export const HEIGHT: number = 0.006;

  /**
   * The horizontal speed under which a socket on the floor is at rest,
   * metres per second: the 50 mm/s marker speed threshold that detects foot
   * contact in barefoot walking (Ghoussayni, Stevens, Durham and Ewins 2004,
   * Assessment and validation of a simple automated method for the detection
   * of gait events and intervals, Gait and Posture 20(3):266-272).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and the source.
   * @evidence contracts/development/design.md#principled-representation One speed compared with a socket's horizontal speed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by this audit and by the tests that set a film at its two sides.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The study's threshold, not tuned to a motion.
   */
  export const SPEED: number = 0.05;

  /**
   * What the reading found.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and what it is read on.
   * @evidence contracts/development/design.md#principled-representation One worst reading per defect and the one share the worst reading cannot tell.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, each asserted by the audit's test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IResult {
    /** The fastest a socket on the floor travels outside every declared window, metres per second, with the foot and the socket. */
    skate: IAutoMovieMotionHumanAuditMeasure;

    /** The part of the film's steps in which a socket skates faster than `SPEED`, in [0, 1]. */
    share: number;

    /** The fastest the contact socket of a foot planted on the ground travels, metres per second, with the action and the foot. */
    loose: IAutoMovieMotionHumanAuditMeasure;

    /** The highest the lowest socket of a foot planted on the ground stands off the floor, metres, with the action and the foot. */
    afloat: IAutoMovieMotionHumanAuditMeasure;
  }

  /**
   * Read one person's feet over a motion.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param rate Grid samples per second.
   * @returns The readings.
   * @throws {Error} When the rate is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation Each step's sockets are classed by the two thresholds and by the declared windows that hold both of its ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A loop over steps and feet with one branch per reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A step is excused from `skate` only by a declared window on that very foot.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each instant's sockets are placed once and shared by the steps on both of its sides.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading; the grid and the windows come from `IAutoMovieMotionHumanAuditMotion`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one instant's sockets per foot while it walks and nothing after it returns.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IHumanBody,
    rate: number = 24,
  ): IResult {
    const none = (): IAutoMovieMotionHumanAuditMeasure => ({
      value: 0,
      seconds: 0,
      where: "none",
    });
    const out: IResult = {
      skate: none(),
      share: 0,
      loose: none(),
      afloat: none(),
    };
    const frames: number[] = IAutoMovieMotionHumanAuditMotion.grid(
      0,
      motion.duration,
      rate,
    );
    const windows: IAutoMovieMotionHumanAuditMotion.IWindow[] =
      IAutoMovieMotionHumanAuditMotion.windows(motion, subject);
    const skated: boolean[] = frames.map((): boolean => false);
    for (const side of ["left", "right"] as const) {
      const part: "leftFoot" | "rightFoot" = `${side}Foot`;
      const declared: IAutoMovieMotionHumanAuditMotion.IWindow[] =
        windows.filter(
          (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
            w.contact.part === part,
        );
      let before: HumanFoot.ISocket[] | null = null;
      for (let i: number = 0; i < frames.length; i++) {
        const t: number = frames[i]!;
        const sole: HumanFoot.ISocket[] = HumanFoot.sockets(
          body,
          motion.bones(subject, t),
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
          const speed = (socket: HumanFoot.ISocket): number => {
            const was: IAutoMovieVector3 = before!.find(
              (s: HumanFoot.ISocket): boolean => s.socket === socket.socket,
            )!.point;
            return (
              Math.hypot(socket.point.x - was.x, socket.point.z - was.z) / span
            );
          };
          const height = (socket: HumanFoot.ISocket): number =>
            before!.find(
              (s: HumanFoot.ISocket): boolean => s.socket === socket.socket,
            )!.point.y;
          if (holding.length === 0)
            for (const socket of sole) {
              if (socket.point.y > HEIGHT || height(socket) > HEIGHT) continue;
              const v: number = speed(socket);
              if (v > SPEED) skated[i] = true;
              if (v > out.skate.value)
                out.skate = {
                  value: v,
                  seconds: t,
                  where: `${part} ${socket.socket}`,
                };
            }
          for (const window of holding) {
            if (
              window.contact.kind !== "plant" ||
              window.contact.support.kind !== "ground"
            )
              continue;
            const where: string = `${window.action} ${part}`;
            const low: HumanFoot.ISocket = lowest(sole);
            if (low.point.y > out.afloat.value)
              out.afloat = { value: low.point.y, seconds: t, where };
            if (lowest(before).socket !== low.socket) continue;
            const v: number = speed(low);
            if (v > out.loose.value)
              out.loose = { value: v, seconds: t, where };
          }
        }
        before = sole;
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

/** The lowest socket of a sole, the heel and then the ball winning a tie within a micrometre. */
const lowest = (sole: readonly HumanFoot.ISocket[]): HumanFoot.ISocket => {
  let contact: HumanFoot.ISocket = sole[0]!;
  for (const socket of sole)
    if (socket.point.y < contact.point.y - 1e-6) contact = socket;
  return contact;
};

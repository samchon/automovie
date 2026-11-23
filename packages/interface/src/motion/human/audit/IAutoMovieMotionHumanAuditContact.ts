import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * Whether the feet's contact with the floor, inferred from the displayed motion
 * itself, agrees with the contact the actions declare.
 *
 * The slip and lift readings of the ground audit look only inside declared
 * plant windows, so a foot that skates along the floor while no window is
 * declared on it goes unread. This reading infers contact the way gait analysis
 * does from kinematics alone: a sole socket (heel, ball or toe) is on the floor
 * while it is no higher than {@link HEIGHT}, and a socket on the floor is at
 * rest while its horizontal speed is no more than {@link SPEED}. Each step
 * between two grid instants is then read twice:
 *
 * - `skate`: outside every window declared on the foot, a socket on the floor at
 *   both ends of the step travels horizontally: a foot dragged or skated along
 *   the floor. `share` is the part of the film's steps in which some socket
 *   does so faster than `SPEED`.
 * - `loose` and `afloat`: inside a plant window on the ground, the foot's lowest
 *   socket must be the contact: `loose` is its horizontal speed while the same
 *   socket stays the lowest, and `afloat` its height off the floor.
 *
 * A window of any kind declared on a foot (a plant, a pivot, a strike) declares
 * its contact, so only steps wholly outside all of them are read for `skate`: a
 * step a window's edge falls inside, between two grid instants, is partly
 * declared and is not read.
 */
export namespace IAutoMovieMotionHumanAuditContact {
  /** What the reading found. */
  export interface IResult {
    /**
     * The fastest a socket on the floor travels outside every declared window,
     * metres per second, with the foot and the socket.
     */
    skate: IAutoMovieMotionHumanAuditMeasure;

    /**
     * The part of the film's steps in which a socket skates faster than
     * `SPEED`, in [0, 1].
     */
    share: number;

    /**
     * The fastest the contact socket of a foot planted on the ground travels,
     * metres per second, with the action and the foot.
     */
    loose: IAutoMovieMotionHumanAuditMeasure;

    /**
     * The highest the lowest socket of a foot planted on the ground stands off
     * the floor, metres, with the action and the foot.
     */
    afloat: IAutoMovieMotionHumanAuditMeasure;
  }
}

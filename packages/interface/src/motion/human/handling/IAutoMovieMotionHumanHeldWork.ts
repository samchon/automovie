import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Working a prop the hand already holds: its fingers drive the prop's own
 * articulations (scissor blades closed by the rings, a folding knife's
 * blade swung open, a chopstick pinched), the hand may carry it to a place
 * before the body (a tray raised on the palm, an umbrella over the head),
 * and the prop may take another prop onto one of its sockets (a morsel
 * pinched between chopstick tips). The grip never opens, so the prop stays
 * in the palm's frame throughout.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three things a held work does and the kept grip.
 * @evidence contracts/development/design.md#principled-representation Articulation travel in its own unit, places in the body's floor frame and sockets by id.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `workHeld` reads, and the drive and mount records `write` shares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The prop is read through its declared articulations and sockets; no prop kind is named.
 */
export namespace IAutoMovieMotionHumanHeldWork {
  /**
   * The parameters of `workHeld`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the held prop, the hand, the drives, the place, the take and the duration.
   * @evidence contracts/development/design.md#principled-representation Seconds, metres in the floor frame and articulation units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs the law reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A work that neither drives, moves nor takes is refused.
   */
  export interface IParams {
    /** The held prop's subject id. */
    prop: string;

    /** The holding hand; the one holding `prop` at entry when absent. */
    side?: AutoMovieHumanSide;

    /** Articulations the holding hand's fingers drive, all over the same span. */
    drive?: readonly IDrive[];

    /** Where the hand carries the prop to, in the performer's floor frame; it stays where it is when absent. */
    at?: IPlace;

    /** A prop set on one of the held prop's sockets at the work's end. */
    take?: IMount;

    /** Seconds of the work before tempo scaling; positive. */
    seconds: number;
  }

  /**
   * One articulation driven to a travel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the articulation and its target travel with its unit.
   * @evidence contracts/development/design.md#principled-representation Degrees for a turning articulation, metres otherwise, as the engine's articulation map has them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a drive reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The travel must lie in the articulation's declared range.
   */
  export interface IDrive {
    /** The articulation affordance id on the held prop. */
    articulation: string;

    /** The travel it ends at: degrees for a turning kind, metres otherwise. */
    to: number;
  }

  /**
   * A prop set on a socket, riding it from the instant it is set.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the prop and the socket.
   * @evidence contracts/development/design.md#principled-representation Subject and affordance ids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a take or a leave reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The socket must exist on its prop.
   */
  export interface IMount {
    /** The prop's subject id. */
    prop: string;

    /** The socket affordance id it rides. */
    point: string;
  }

  /**
   * A hand place in the performer's floor frame: the frame at the pelvis'
   * floor point, turned to the performer's heading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three offsets and their frame.
   * @evidence contracts/development/design.md#principled-representation Metres along the heading's right, up and forward.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `workHeld` places the held prop's origin at.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A place beyond the arm is refused.
   */
  export interface IPlace {
    /** Metres toward the holding hand's side. */
    out: number;

    /** Metres above the floor. */
    up: number;

    /** Metres ahead. */
    forward: number;

    /** Keep the prop's declared up on the world's up, as a tray or an umbrella; its attitude in the hand is kept when absent. */
    level?: boolean;
  }

  /**
   * A second held tool kept still on the work through a stroke: a fork's
   * tines pinning the food the knife saws.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the steadying tool, its working point and where on the surface it stays.
   * @evidence contracts/development/design.md#principled-representation A subject, an affordance id and a planar point on the stroke's surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `write` reads for its steadying hand.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tool must be held by the other hand.
   */
  export interface ISteady {
    /** The other hand's held tool. */
    tool: string;

    /** The tool's working-point affordance id. */
    tip: string;

    /** The point on the writing surface it stays on, [X, Z] metres in the surface's frame. */
    at: readonly [number, number];
  }
}

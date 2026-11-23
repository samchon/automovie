import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Working a prop the hand already holds: its fingers drive the prop's own
 * articulations (scissor blades closed by the rings, a folding knife's blade
 * swung open, a chopstick pinched), the hand may carry it to a place before the
 * body (a tray raised on the palm, an umbrella over the head), and the prop may
 * take another prop onto one of its sockets (a morsel pinched between chopstick
 * tips). The grip never opens, so the prop stays in the palm's frame
 * throughout.
 */
export namespace IAutoMovieMotionHumanHeldWork {
  /** The parameters of `workHeld`. */
  export interface IParams {
    /** The held prop's subject id. */
    prop: string;

    /** The holding hand; the one holding `prop` at entry when absent. */
    hand?: AutoMovieHumanSide;

    /** Articulations the holding hand's fingers drive, all over the same span. */
    drive?: readonly IDrive[];

    /**
     * Where the hand carries the prop to, in the performer's floor frame; it
     * stays where it is when absent.
     */
    at?: IPlace;

    /** A prop set on one of the held prop's sockets at the work's end. */
    take?: IMount;

    /**
     * The other hand's grip kept on a contact riding a driven articulation,
     * moving it: the free hand pushing an umbrella's runner up the shaft. Not
     * with `at`: the holding hand stays still while the other works.
     */
    push?: string;

    /**
     * Seconds of the work before tempo scaling; positive. Required: no natural
     * value is defined, so the author sets it (provisional: no timing study was
     * read).
     */
    duration: number;
  }

  /** One articulation driven to a travel. */
  export interface IDrive {
    /** The articulation affordance id on the held prop. */
    articulation: string;

    /** The travel it ends at: degrees for a turning kind, metres otherwise. */
    to: number;

    /**
     * The holding hand's digit that works it, kept on a contact riding the
     * articulation: the thumb in a scissor ring. The hold's fingers stay as
     * they are when absent.
     */
    by?: IDigit;
  }

  /** A digit of the holding hand kept on a moving contact of the held prop. */
  export interface IDigit {
    /** Which digit, on the holding hand. */
    digit: Digit;

    /** The contact it stays on, riding the driven articulation. */
    site: string;
  }

  /** A digit of one hand. */
  export type Digit = "thumb" | "index" | "middle" | "ring" | "little";

  /** A prop set on a socket, riding it from the instant it is set. */
  export interface IMount {
    /** The prop's subject id. */
    prop: string;

    /** The socket affordance id it rides. */
    point: string;
  }

  /**
   * A hand place in the performer's floor frame: the frame at the pelvis' floor
   * point, turned to the performer's heading.
   */
  export interface IPlace {
    /** Metres toward the holding hand's side. */
    out: number;

    /** Metres above the floor. */
    up: number;

    /** Metres ahead. */
    forward: number;

    /**
     * Keep the prop's declared up on the world's up, as a tray or an umbrella;
     * its attitude in the hand is kept when absent.
     */
    level?: boolean;
  }

  /**
   * A second held tool kept still on the work through a stroke: a fork's tines
   * pinning the food the knife saws.
   */
  export interface ISteady {
    /** The other hand's held tool. */
    tool: string;

    /** The tool's working-point affordance id. */
    tip: string;

    /**
     * The point on the writing surface it stays on, [X, Z] metres in the
     * surface's frame.
     */
    at: readonly [number, number];
  }
}

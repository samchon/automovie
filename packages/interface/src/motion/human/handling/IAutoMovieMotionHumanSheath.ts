import type { IAutoMovieMotionHumanProp } from "../perform/IAutoMovieMotionHumanProp";

/**
 * A rigid blade staged seated in a separate carrier, such as a sword in its
 * scabbard or a knife in its sheath, and the line it is drawn and returned
 * along.
 *
 * The carrier declares its mouth as a socket whose `+Y` points out of the
 * opening. The blade declares its tip on its own `+Y`, the convention of a
 * blade standing along `+Y` from its shoulder, and a handle a hand grips.
 * Seated, the blade's shoulder is on the mouth and its tip points into the
 * carrier. Drawn, the blade's frame has travelled out of the mouth along the
 * mouth's `+Y` until its tip clears the mouth by `clearance`. `HumanSheath`
 * stages the pair and composes the draw and the return.
 */
export namespace IAutoMovieMotionHumanSheath {
  /** What the author names to seat a blade in a carrier. */
  export interface IParams {
    /** The carrier's mouth socket id, its `+Y` out of the opening. */
    mouth: string;

    /** The blade's tip affordance id, on the blade's `+Y`. */
    tip: string;

    /** The blade's handle affordance id the drawing hand grips. */
    handle: string;

    /**
     * How far the tip clears the mouth when the blade is drawn, metres;
     * positive.
     */
    clearance: number;
  }

  /** The staged pair the draw and the return compose against. */
  export interface IStaged {
    /** The blade's scene subject id. */
    blade: string;

    /** The carrier's scene subject id. */
    carrier: string;

    /** The blade's handle affordance id. */
    handle: string;

    /** The carrier socket the seated blade's frame coincides with. */
    seat: string;

    /** The carrier socket the drawn blade's frame coincides with. */
    entry: string;

    /** The carrier's slider articulation from the seat toward the entry, metres. */
    slider: string;

    /** The carrier socket riding the slider, which guides the blade out. */
    slide: string;
  }

  /** The two props as the performance takes them, with the staged identities. */
  export interface IStaging {
    /** The carrier, with the seat and entry sockets added. */
    carrier: IAutoMovieMotionHumanProp;

    /** The blade, mounted on the carrier's seat from the film's start. */
    blade: IAutoMovieMotionHumanProp;

    /** The staged identities. */
    sheath: IStaged;
  }
}

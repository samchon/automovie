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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the carrier and blade conventions, the seated and drawn frames and the owner that stages them.
 * @evidence contracts/development/design.md#principled-representation The pair is named by scene subjects and affordance ids, and the clearance is a length in metres along the mouth's own axis, so the staged frames follow the carrier wherever it is worn.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The staging input and the staged identities the draw and return compositions read; `HumanSheath` owns both.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No blade or carrier kind is named; the frames are derived from the declared mouth and tip.
 */
export namespace IAutoMovieMotionHumanSheath {
  /**
   * What the author names to seat a blade in a carrier.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the affordances read and the clearance unit.
   * @evidence contracts/development/design.md#principled-representation Affordance ids of the two models and a positive clearance in metres; `HumanSheath.of` refuses an id the models lack and a clearance that is not positive and finite.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read once by `HumanSheath.of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member combines with another into an invalid state.
   */
  export interface IParams {
    /** The carrier's mouth socket id, its `+Y` out of the opening. */
    mouth: string;

    /** The blade's tip affordance id, on the blade's `+Y`. */
    tip: string;

    /** The blade's handle affordance id the drawing hand grips. */
    handle: string;

    /** How far the tip clears the mouth when the blade is drawn, metres; positive. */
    clearance: number;
  }

  /**
   * The staged pair the draw and the return compose against.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each subject and the two derived carrier sockets.
   * @evidence contracts/development/design.md#principled-representation Scene subject ids and affordance ids; the line between the two sockets lives on the carrier, so it follows the carrier.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `HumanSheath.draw` reads every member; `HumanSheath.sheathe` reads all but the handle.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Produced only by `HumanSheath.of`, so the sockets exist on the staged carrier.
   */
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

  /**
   * The two props as the performance takes them, with the staged identities.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the carrier with its derived sockets, the blade mounted on the seat and the staged identities.
   * @evidence contracts/development/design.md#principled-representation Two ordinary performance props and the staged record; the blade's initial mount names the carrier's seat.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The author passes both props to `HumanPerformance` and the record to the compositions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The props keep the carrier's own wearing or placement and the blade's own model data.
   */
  export interface IStaging {
    /** The carrier, with the seat and entry sockets added. */
    carrier: IAutoMovieMotionHumanProp;

    /** The blade, mounted on the carrier's seat from the film's start. */
    blade: IAutoMovieMotionHumanProp;

    /** The staged identities. */
    sheath: IStaged;
  }
}

import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanTipHat } from "../dressing/IAutoMovieMotionHumanTipHat";
import type { IAutoMovieMotionHumanWardrobe } from "../dressing/IAutoMovieMotionHumanWardrobe";
import type { IAutoMovieMotionHumanDrawFromCarrier } from "../handling/IAutoMovieMotionHumanDrawFromCarrier";
import type { IAutoMovieMotionHumanSheath } from "../handling/IAutoMovieMotionHumanSheath";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";

/**
 * Putting on, taking off and fastening clothing.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanDress` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanDress<Chain> {
  /**
   * Putting on a hat or a pair of glasses held in one hand, with both hands,
   * while standing.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims only the parts it moves, seated or while another action carries the
   * body; it can be cut into `stand` and `walk` from its `relax` instant.
   *
   * @param params The `item`, `prop`, `hand` and `manner` of
   *   `IAutoMovieMotionHumanDress.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  dress(params: IAutoMovieMotionHumanDress.IParams, anchor?: string): Chain;

  /**
   * Dressing oneself with a staged garment: carrying a held open-front jacket
   * on, threading or clearing one sleeve, moving its zip, or putting footwear
   * on or taking it off one raised foot while seated.
   *
   * Registered law: `registered("wardrobe", params)`; not a chain method.
   *
   * @param params The `kind`, `prop` and the mode's own `hand`, `side` or
   *   `held` of `IAutoMovieMotionHumanWardrobe`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  wardrobe(params: IAutoMovieMotionHumanWardrobe, anchor?: string): Chain;

  /**
   * A one-handed greeting that lifts and reseats a hat already worn on the
   * performer's head.
   *
   * Registered law: `registered("tipHat", params)`; not a chain method.
   *
   * @param params The `prop` and `hand` of `IAutoMovieMotionHumanTipHat`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  tipHat(params: IAutoMovieMotionHumanTipHat, anchor?: string): Chain;

  /**
   * Drawing a blade out of the carrier it is staged seated in: the hand grips
   * the blade's handle, then draws it out along the carrier's guide from the
   * seat to the entry, where the hand holds it. With `pull`, the other hand
   * first takes the carrier's throat, for a blade longer than the arm draws
   * alone.
   *
   * Registered law: `registered("drawFromCarrier", params)`; not a chain
   * method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims the drawing arm and its hand only, a seated rider's draw.
   *
   * @param params The `sheath`, `hand` and `pull` of
   *   `IAutoMovieMotionHumanDress.IDrawFromCarrier`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the grip and the draw appended; the grip's
   *   `gripClosed` marks closure, and the draw's `unseated` and `drawn` mark
   *   the start and the end of the withdrawal.
   */
  drawFromCarrier(
    params: IAutoMovieMotionHumanDress.IDrawFromCarrier,
    anchor?: string,
  ): Chain;

  /**
   * Returning the held blade through the carrier's entry to its seat: the hand
   * carries the blade to the entry, the carrier's guide takes it straight to
   * the seat at the same attitude, and the hand opens as the blade mounts on
   * the seat.
   *
   * Registered law: `registered("putDownAperture", params)`; not a chain
   * method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims the hand's work alone over a carrier; it is cut as `putDown` is.
   *
   * @param params The `sheath` and `hand` of
   *   `IAutoMovieMotionHumanDress.IPutDownAperture`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the return appended; its `aperture`, `placed` and
   *   `release` events mark the entry, the seat and the opened hand.
   */
  putDownAperture(
    params: IAutoMovieMotionHumanDress.IPutDownAperture,
    anchor?: string,
  ): Chain;
}

/** The parameter types of the Dress methods. */
export namespace IAutoMovieMotionHumanDress {
  /**
   * The parameters of `drawFromCarrier`: the staged pair, the drawing hand and
   * the other hand's pull.
   *
   * The pair is `HumanSheath.of`'s staged record, which names the blade, the
   * carrier and the sockets the draw runs between.
   */
  export interface IDrawFromCarrier {
    /** The staged blade and carrier, as `HumanSheath.of` returns them. */
    sheath: IAutoMovieMotionHumanSheath.IStaged;

    /** The drawing hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /**
     * The other hand's pull on a worn carrier, for a blade longer than the arm
     * draws alone; the carrier holds still when absent.
     */
    pull?: IAutoMovieMotionHumanDrawFromCarrier.IPull;
  }

  /** The parameters of `putDownAperture`: the staged pair and the holding hand. */
  export interface IPutDownAperture {
    /** The staged blade and carrier, as `HumanSheath.of` returns them. */
    sheath: IAutoMovieMotionHumanSheath.IStaged;

    /** The holding hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }
}

/**
 * Putting on a hat or a pair of glasses held in one hand, with both hands,
 * while standing.
 *
 * The item is the wearable prop the hand holds since a pick-up (`prop`, by its
 * `hold`): that hand carries it, rigid in the hand
 * (`AutoMovieMotionHumanHeld`), so that its own `wear` socket comes onto the
 * head's region it is worn on (`HumanWorn`: a hat's on the crown, a pair of
 * glasses' on the nose's bridge), spectacles facing the way the body faces and
 * a hat, round about its crown, at whichever turn the arm, fitted within its
 * ranges, brings the wear socket nearest the crown at (the shared chooser,
 * `HumanFreedomChoice`, the turn a wrapped freedom); from the stroke it is worn
 * on the head (`IAutoMovieMotionHumanActionPlan.wears`) and the hand lets go.
 * The other hand steadies it at a place on the performer's own head, read on
 * the posture so it follows the head: a hat's brim at the side of the head's
 * girth (`HAT`, provisional), the palm on the head's own surface; a pair of
 * glasses' temple just before the ear, the index finger pointing back along it.
 * Both hands rise to a place a quarter of the forearm before the item's final
 * place in front of the face (the item held up), then move it onto the head in
 * a stroke, hold it a moment and return. The reach takes the aimed movement
 * time (McIntosh et al. 2018), the stroke a beat, both provisional. The
 * shoulder's elevation stays within the functional ranges of daily tasks
 * (flexion 121, abduction 128 degrees, Namdari et al. 2012, J Shoulder Elbow
 * Surg 21:1177), which the capture checks. Events: the phrase's `ready` (item
 * held up), `strokeStart`, `stroke` (item on), `relax` (hands off).
 *
 * Not yet: the jacket through rigid sleeve sockets, shoes and socks while
 * seated, zips and buttons (garment sockets as props), and a watch on the other
 * wrist.
 */
export namespace IAutoMovieMotionHumanDress {
  /** Parameters. */
  export interface IParams {
    /** The item: where it is worn and how the free hand steadies it. */
    item: IAutoMovieMotionHumanDress.Item;

    /**
     * The wearable's prop subject, held since a pick-up: its `wear` socket is
     * put on the head (`createWearable`'s contacts).
     */
    prop: string;

    /**
     * The hand that holds it; the one the entry holds it in when absent,
     * `right` if neither.
     */
    hand?: AutoMovieHumanSide;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * A hand's place for an item on a posture, and the surface laid there. An
   * item put on.
   */
  export type Item = "hat" | "glasses";

  /**
   * A hand's place for an item on a posture, and the surface laid there. Result
   * returned by dress.place. The point, the normal the hand's surface is laid
   * against, the surface and where its forward points: a palm flat on the head
   * with the fingers ahead, or an index finger pointing back along the temple
   * with the palm toward the head.
   */
  export type IPlaceResult = {
    /** Dressing contact point in world metres. */
    point: IAutoMovieVector3;
    /** Outward target normal in world coordinates. */
    normal: IAutoMovieVector3;
    /** Hand surface placed on the item: palm for a hat, index tip for glasses. */
    surface: IAutoMovieMotionHumanHand.Surface;
    /**
     * Preferred fingers direction in world coordinates, derived from the item's
     * wearing orientation.
     */
    forward: IAutoMovieVector3;
  };
}

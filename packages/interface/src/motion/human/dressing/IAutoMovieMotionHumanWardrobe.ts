import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Dressing oneself with a staged garment (`wardrobe`): carry a held
 * open-front jacket on, thread or clear one sleeve, move its zip, or put
 * footwear on or take it off one raised foot while seated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each mode and the members it takes.
 * @evidence contracts/development/design.md#principled-representation A discriminated union on `kind`: each mode carries only the side or hand it reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The modes the wardrobe law performs, read by `wardrobe` and the lexicon's upperDress row.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every mode names the staged wearable prop; no garment geometry is restated here.
 */
export type IAutoMovieMotionHumanWardrobe =
  | IAutoMovieMotionHumanWardrobe.IJacket
  | IAutoMovieMotionHumanWardrobe.ISide
  | IAutoMovieMotionHumanWardrobe.IFoot;

export namespace IAutoMovieMotionHumanWardrobe {
  /**
   * The modes that thread or clear one sleeve or move the zip with one hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four one-sided modes: thread or clear a sleeve, close or open the zip.
   * @evidence contracts/development/design.md#principled-representation A closed union of the modes that act on one side, the discriminant of `ISide`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `ISide.kind` reads it and `wardrobe` branches on it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per mode, so a one-sided mode cannot carry the jacket's or the foot's members.
   */
  export type Sided = "sleeveIn" | "sleeveOut" | "closeZip" | "openZip";

  /**
   * The seated modes that put footwear on or take it off one foot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two seated footwear modes, on and off.
   * @evidence contracts/development/design.md#principled-representation A closed union of the footwear modes, the discriminant of `IFoot`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IFoot.kind` reads it and `wardrobe` branches on it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per mode, so a footwear mode cannot carry the jacket's or the sleeve's members.
   */
  export type Footwear = "footwearOn" | "footwearOff";

  /**
   * Carry a held open-front jacket on, threading the other hand first.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The mode, the jacket and the hand that holds it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, read by `wardrobe`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The jacket's sleeves and hold are its own contacts.
   */
  export interface IJacket {
    /** The mode. */
    kind: "jacketOn";

    /** The wearable prop's scene id. */
    prop: string;

    /** The hand that already holds the jacket; the right when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * Thread or clear one sleeve, or move the zip, on one side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The mode, the garment and the side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, read by `wardrobe`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The sleeve and the slider are the garment's own contacts.
   */
  export interface ISide {
    /** The mode. */
    kind: Sided;

    /** The wearable prop's scene id. */
    prop: string;

    /** The arm in the sleeve, or the hand on the slider. */
    side: AutoMovieHumanSide;

    /** Whether another performer holds the jacket open at this performer's collar, as `coatPartner` does: the sleeve is threaded where that hold puts the jacket. The jacket already worn when absent. */
    held?: boolean;
  }

  /**
   * Put footwear on or take it off one raised foot while seated.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The mode, the footwear, the foot and the hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, read by `wardrobe`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The footwear's opening is its own contact.
   */
  export interface IFoot {
    /** The mode. */
    kind: Footwear;

    /** The wearable prop's scene id. */
    prop: string;

    /** The foot. */
    side: AutoMovieHumanSide;

    /** The hand that takes the footwear; the other side's when absent. */
    hand?: AutoMovieHumanSide;
  }
}

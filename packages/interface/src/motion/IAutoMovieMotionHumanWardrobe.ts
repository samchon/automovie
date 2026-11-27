import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Dressing oneself with a staged garment (`wardrobe`): carry a held open-front
 * jacket on, thread or clear one sleeve, move its zip, or put footwear on or
 * take it off one raised foot while seated.
 */
export type IAutoMovieMotionHumanWardrobe =
  | IAutoMovieMotionHumanWardrobe.IJacket
  | IAutoMovieMotionHumanWardrobe.ISide
  | IAutoMovieMotionHumanWardrobe.IFoot;

export namespace IAutoMovieMotionHumanWardrobe {
  /** The modes that thread or clear one sleeve or move the zip with one hand. */
  export type Sided = "sleeveIn" | "sleeveOut" | "closeZip" | "openZip";

  /** The seated modes that put footwear on or take it off one foot. */
  export type Footwear = "footwearOn" | "footwearOff";

  /** Carry a held open-front jacket on, threading the other hand first. */
  export interface IJacket {
    /** The mode. */
    kind: "jacketOn";

    /** The wearable prop's scene id. */
    prop: string;

    /** The hand that already holds the jacket; the right when absent. */
    hand?: AutoMovieHumanSide;
  }

  /** Thread or clear one sleeve, or move the zip, on one side. */
  export interface ISide {
    /** The mode. */
    kind: Sided;

    /** The wearable prop's scene id. */
    prop: string;

    /** The arm in the sleeve, or the hand on the slider. */
    side: AutoMovieHumanSide;

    /**
     * Whether another performer holds the jacket open at this performer's
     * collar, as `coatPartner` does: the sleeve is threaded where that hold
     * puts the jacket. The jacket already worn when absent.
     */
    held?: boolean;
  }

  /** Put footwear on or take it off one raised foot while seated. */
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

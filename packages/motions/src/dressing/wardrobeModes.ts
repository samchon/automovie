import type { AutoMovieHumanSide } from "@automovie/interface";

import type { wardrobeHands } from "./wardrobeHands";

/** The wardrobe law's modes and the parameters each takes. */
export namespace wardrobeModes {
  /** The modes that thread or clear one sleeve or move the zip with one hand. */
  export type Sided = "sleeveIn" | "sleeveOut" | "closeZip" | "openZip";

  /** The seated modes that put footwear on or take it off one foot. */
  export type Footwear = "footwearOn" | "footwearOff";

  /** Carry a held open-front jacket on, threading the other hand first. */
  export interface IJacket extends wardrobeHands.IPropParams {
    /** The mode. */
    kind: "jacketOn";

    /** The hand that already holds the jacket. Defaults to right. */
    hand?: AutoMovieHumanSide;
  }

  /** Thread or clear one sleeve, or move the zip, on one side. */
  export interface ISide extends wardrobeHands.IPropParams {
    /** The mode. */
    kind: Sided;

    /** The arm in the sleeve, or the hand on the slider. */
    side: AutoMovieHumanSide;
  }

  /** Put footwear on or take it off one raised foot while seated. */
  export interface IFoot extends wardrobeHands.IPropParams {
    /** The mode. */
    kind: Footwear;

    /** The foot. */
    side: AutoMovieHumanSide;

    /** The hand that takes the footwear. Defaults to the other side's. */
    hand?: AutoMovieHumanSide;
  }

  /** The installed wardrobe actions and their requested direction and side. */
  export type Params = IJacket | ISide | IFoot;
}

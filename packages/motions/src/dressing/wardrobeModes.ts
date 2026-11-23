import type { IAutoMovieMotionHumanWardrobe } from "@automovie/interface";

/**
 * The wardrobe law's modes and the parameters each takes
 * (`IAutoMovieMotionHumanWardrobe`).
 */
export namespace wardrobeModes {
  /** The modes that thread or clear one sleeve or move the zip with one hand. */
  export type Sided = IAutoMovieMotionHumanWardrobe.Sided;

  /** The seated modes that put footwear on or take it off one foot. */
  export type Footwear = IAutoMovieMotionHumanWardrobe.Footwear;

  /** Carry a held open-front jacket on, threading the other hand first. */
  export type IJacket = IAutoMovieMotionHumanWardrobe.IJacket;

  /** Thread or clear one sleeve, or move the zip, on one side. */
  export type ISide = IAutoMovieMotionHumanWardrobe.ISide;

  /** Put footwear on or take it off one raised foot while seated. */
  export type IFoot = IAutoMovieMotionHumanWardrobe.IFoot;

  /** The installed wardrobe actions and their requested direction and side. */
  export type Params = IAutoMovieMotionHumanWardrobe;
}

import type { IAutoMovieHumanFootBody } from "./IAutoMovieHumanFootBody";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";

/**
 * Type contracts exchanged by AutoMovieHumanFootMalleolusWindow; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanFootMalleolusWindow {
  /** What a window's place reads. */
  export interface IInput {
    /** The foot's frame. */
    frame: IAutoMovieHumanFootFrame.IFrame;

    /** The body whose guide the malleolus stands on. */
    body: IAutoMovieHumanFootBody.IBody;

    /** Which border. */
    which: "lateral" | "medial";

    /** The malleolus's centre height, lateral malleolus heights. */
    height: number;

    /** The malleolus's radius, mm. */
    radius: number;

    /** 1 for the left foot, -1 for the right's reflection. */
    sign: 1 | -1;
  }

  /** A window's place. */
  export interface IPlace {
    /** The stations the window covers, lowest first. */
    stations: [number, number];

    /** The phases it covers, in the side's ring order. */
    phases: [number, number];
  }
}

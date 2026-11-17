import type { IAutoMovieHumanFootBody } from "./IAutoMovieHumanFootBody";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";

/**
 * Type contracts exchanged by AutoMovieHumanFootMalleolusWindow; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanFootMalleolusWindow exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IInput, IPlace. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanFootMalleolusWindow; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IInput, IPlace contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanFootMalleolusWindow {
  /** What a window's place reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a window's place reads.
   * @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `body`: The body whose guide the malleolus stands on. `which`: Which border.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootMalleolusWindow.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `body`, `which`, `height`, `radius`, `sign`; callers supply the complete record.
   */
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

  /** A window's place.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A window's place.
   * @evidence contracts/development/design.md#principled-representation `stations`: The stations the window covers, lowest first. `phases`: The phases it covers, in the side's ring order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootMalleolusWindow.of. Also types AutoMovieHumanFootMalleolus.place.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stations`, `phases`; callers supply the complete record.
   */
  export interface IPlace {
    /** The stations the window covers, lowest first. */
    stations: [number, number];

    /** The phases it covers, in the side's ring order. */
    phases: [number, number];
  }
}

import type { IAutoMovieHumanTrunkGroinWidth } from "@automovie/interface";

import { AutoMovieHumanTrunkTapes } from "./AutoMovieHumanTrunkTapes";

/**
 * The crotch ring's half width: the groin width the leg modeler reads.
 *
 * The ring stands where the two thighs part, so its girth is two thighs' tops:
 * the ring's girth over twice the thigh tape's girth (ISO 8559-1 5.3.6, the
 * largest horizontal girth just under the crotch). When the person's thigh tape
 * and a source-derived ratio are given, the half width is solved on the ring's
 * own hull so the ring's girth is `2 * ratio * thigh`. ESTIMATE: carry the
 * neighbouring buttock width over the short distance to the crotch when those
 * inputs are absent.
 */
export namespace AutoMovieHumanTrunkGroinWidth {
  /**
   * The crotch's half width.
   *
   * @param input The buttock's width, the tape, the ratio and the ring's girth.
   * @returns The half width, mm.
   */
  export function width(input: IAutoMovieHumanTrunkGroinWidth.IInput): number {
    const guess: number = input.buttock;
    if (input.thigh === undefined || input.ratio === undefined) return guess;

    return AutoMovieHumanTrunkTapes.solve(
      2 * input.ratio * input.thigh,
      input.girth,
      guess,
    );
  }
}

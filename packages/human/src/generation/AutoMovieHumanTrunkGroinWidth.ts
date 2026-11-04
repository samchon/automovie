import { AutoMovieHumanTrunkShapes } from "./AutoMovieHumanTrunkShapes";
import { AutoMovieHumanTrunkTapes } from "./AutoMovieHumanTrunkTapes";

/**
 * The crotch ring's half width: the groin width the leg modeler reads.
 *
 * The ring stands where the two thighs part, so its girth is two thighs' tops:
 * the ring's girth over twice the thigh tape's girth (ISO 8559-1 5.3.6, the
 * largest horizontal girth just under the crotch) is a ratio the leg reports
 * from the four references. When the person's thigh tape and that ratio are
 * given, the half width is solved on the ring's own hull so the ring's girth
 * is `2 * ratio * thigh`; otherwise it is the buttock's half width times the
 * references' median ratio, `AutoMovieHumanTrunkShapes.CROTCH_WIDTH`.
 */
export namespace AutoMovieHumanTrunkGroinWidth {
  /** What the width reads. */
  export interface IInput {
    /** The buttock's half width, mm. */
    buttock: number;

    /** The thigh tape, mm; absent, the references' median ratio is used. */
    thigh?: number;

    /** The ring's half girth over the thigh tape, as the leg reports it; absent, the references' median ratio is used. */
    ratio?: number;

    /** The ring's girth at a trial half width, mm: the hull of its own section. */
    girth: (width: number) => number;
  }

  /**
   * The crotch's half width.
   *
   * @param input The buttock's width, the tape, the ratio and the ring's girth.
   * @returns The half width, mm.
   */
  export function width(input: IInput): number {
    const guess: number = AutoMovieHumanTrunkShapes.CROTCH_WIDTH * input.buttock;
    if (input.thigh === undefined || input.ratio === undefined) return guess;

    return AutoMovieHumanTrunkTapes.solve(2 * input.ratio * input.thigh, input.girth, guess);
  }
}

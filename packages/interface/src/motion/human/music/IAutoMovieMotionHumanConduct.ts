import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanDance } from "../exercise/IAutoMovieMotionHumanDance";

/**
 * Conducting with a held baton: its tip beats the standard figure of the
 * meter on the beat clock, the ictus, the tip's lowest point of each beat,
 * falling on the beat's instant. The figures follow Max Rudolf, *The
 * Grammar of Conducting* (3rd ed., Schirmer, 1995): 2/4 down and up, 3/4
 * down, out and up, 4/4 down, in, out and up, "in" toward the body's
 * midline and "out" away from it for the baton hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the figures, the ictus rule and their source.
 * @evidence contracts/development/design.md#principled-representation A closed meter union, a bar count and the shared beat clock's tempo or cue-track lock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `conduct` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The figure is the meter's; no free path is authorable.
 */
export namespace IAutoMovieMotionHumanConduct {
  /**
   * The meter whose figure the baton beats.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three meters; the namespace states each one's figure.
   * @evidence contracts/development/design.md#principled-representation A closed union of the meters with a standard beat figure in Rudolf's Grammar of Conducting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IParams.meter` reads it and `conduct` chooses the figure by it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per meter, so a meter without a figure cannot be named.
   */
  export type Meter = "2/4" | "3/4" | "4/4";

  /**
   * The parameters of `conduct`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the baton, the meter, the bars, the tempo, the lock and the hand.
   * @evidence contracts/development/design.md#principled-representation Beats per minute, a whole bar count and the dance beat clock's lock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs the law reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The baton must be held at entry.
   */
  export interface IParams {
    /** The held baton's subject id; its `tip` is the beating point. */
    baton: string;

    /** The meter. */
    meter: Meter;

    /** Bars to beat; 2 when absent. */
    bars?: number;

    /** Beats per minute; 120 when absent. */
    bpm?: number;

    /** A cue track whose beats the ictuses fall on, as a dance locks to it; `bpm` is then not read. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];

    /** The baton hand; the one holding the baton at entry when absent. */
    side?: AutoMovieHumanSide;
  }
}

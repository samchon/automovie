import type { IAutoMovieMotionHumanManipulate } from "../handling/IAutoMovieMotionHumanManipulate";

/**
 * Open parameters of the manipulate lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The manipulate family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the manipulate row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconManipulateParams {
  /** The keyed contact sequence itself, for a production that names its own contacts. */
  sequence: IAutoMovieMotionHumanManipulate.IParams;

  /** Touch typing: a text on a keyboard, both hands, each letter by the digit the home-row chart assigns. */
  type: Omit<IAutoMovieMotionHumanManipulate.IParams, "side">;

  /** Two-finger typing: a text on a keyboard, each key pressed by the forefinger of the hand on its side, `typeText`'s act as a row of the keyed sequence (#3361). */
  typeTwoFinger: Omit<
    IAutoMovieMotionHumanManipulate.IParams,
    "side" | "digit"
  >;

  /** Playing a keyboard instrument: both hands, each note's digit by the fingering that keeps the hands still unless the score names it. */
  play: Omit<IAutoMovieMotionHumanManipulate.IParams, "side">;

  /** Fretting a guitar: the left hand's digits on the fret sites, the fingering keeping the hand still (Handrix's outcome, ElKoura and Singh 2003). */
  fret: Omit<IAutoMovieMotionHumanManipulate.IParams, "side">;

  /** Strumming or plucking: the right hand's digits across the string sites. */
  strum: Omit<IAutoMovieMotionHumanManipulate.IParams, "side">;

  /** Dialling: the right forefinger on each key in turn. */
  dial: Omit<IAutoMovieMotionHumanManipulate.IParams, "side" | "digit">;

  /** Texting with a thumb: the right thumb on each key of the held phone's screen. */
  thumbText: Omit<IAutoMovieMotionHumanManipulate.IParams, "side" | "digit">;
}

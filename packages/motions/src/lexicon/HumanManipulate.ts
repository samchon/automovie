import { manipulate } from "../handling/manipulate";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Keyed contact sequences: the digits pressing the sites of a prop one after
 * another, each a row of `manipulate`. Register the ones a film uses
 * (`HumanPerformance.IInput.laws`, `HumanChain.extend`); `manipulate` itself
 * is registered with them.
 *
 * Writing with a pen waits on its glyph strokes: no single-stroke font's
 * licence has been checked for shipping its data, so a production gives its
 * strokes as contacts until one is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row fixes and what waits.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of `manipulate` (`HumanActionRow`), data over a law that already places the hand, fits the digits and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's law and rows and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanManipulate {
  /** The keyed contact sequence itself, for a production that names its own contacts. */
  export const sequence = manipulate;

  /** Touch typing: a text on a keyboard, both hands, each letter by the digit the home-row chart assigns. */
  export const type = HumanActionRow.of("type", manipulate, { side: "both" });

  /** Two-finger typing: a text on a keyboard, each key pressed by the forefinger of the hand on its side, `typeText`'s act as a row of the keyed sequence (#3361). */
  export const typeTwoFinger = HumanActionRow.of("typeTwoFinger", manipulate, {
    side: "both",
    digit: "index",
  });

  /** Playing a keyboard instrument: both hands, each note's digit by the fingering that keeps the hands still unless the score names it. */
  export const play = HumanActionRow.of("play", manipulate, { side: "both" });

  /** Fretting a guitar: the left hand's digits on the fret sites, the fingering keeping the hand still (Handrix's outcome, ElKoura and Singh 2003). */
  export const fret = HumanActionRow.of("fret", manipulate, { side: "left" });

  /** Strumming or plucking: the right hand's digits across the string sites. */
  export const strum = HumanActionRow.of("strum", manipulate, {
    side: "right",
  });

  /** Dialling: the right forefinger on each key in turn. */
  export const dial = HumanActionRow.of("dial", manipulate, {
    side: "right",
    digit: "index",
  });

  /** Texting with a thumb: the right thumb on each key of the held phone's screen. */
  export const thumbText = HumanActionRow.of("thumbText", manipulate, {
    side: "right",
    digit: "thumb",
  });
}

import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanManipulate,
} from "@automovie/interface";

import { manipulate } from "../handling/internal/manipulate";
import { manipulateHeld } from "../handling/internal/manipulateHeld";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";

/**
 * Keyed contact sequences: the digits pressing the sites of a prop one after
 * another, each a row of `manipulate`. Register the ones a film uses
 * (`HumanPerformance.IInput.laws`, `HumanChain.extend`); `manipulate` itself is
 * registered with them.
 *
 * Register the separate write law to trace an authored planar stroke with a
 * held tool.
 */
export namespace HumanManipulate {
  /**
   * The keyed contact sequence itself, for a production that names its own
   * contacts.
   */
  export const sequence = manipulate;

  /**
   * Touch typing: a text on a keyboard, both hands, each letter by the digit
   * the home-row chart assigns; one letter every 0.5 s at novice skill to 0.15
   * s at elite ({@link manipulate}, Salthouse 1986).
   */
  export const type: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["manipulate"]["type"]
  > = AutoMovieMotionHumanActionRow.of("type", manipulate, { hand: "both" });

  /**
   * Two-finger typing: a text on a keyboard, each key pressed by the forefinger
   * of the hand on its side, `typeText`'s act as a row of the keyed sequence.
   */
  export const typeTwoFinger: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["manipulate"]["typeTwoFinger"]
  > = AutoMovieMotionHumanActionRow.of("typeTwoFinger", manipulate, {
    hand: "both",
    digit: "index",
  });

  /**
   * Playing a keyboard instrument: both hands, each note's digit by the
   * fingering that keeps the hands still unless the score names it. One note
   * every 0.5 s at novice skill to 0.15 s at elite ({@link manipulate},
   * Salthouse 1986, a typing interval used for want of a measured piano one:
   * provisional) unless the notes give their times (`at`); playing a piece.
   */
  export const play: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["manipulate"]["play"]
  > = AutoMovieMotionHumanActionRow.of("play", manipulate, { hand: "both" });

  /**
   * Fretting a guitar: the left hand's digits on the fret sites, the fingering
   * keeping the hand still (Handrix's outcome, ElKoura and Singh 2003). The
   * chord or note times are the score's `at`, or the skill interval of
   * `manipulate` (0.5 s novice to 0.15 s elite, provisional for guitar);
   * playing guitar.
   */
  export const fret: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["manipulate"]["fret"]
  > = AutoMovieMotionHumanActionRow.of("fret", manipulate, { hand: "left" });

  /**
   * Strumming or plucking: the right hand's digits across the string sites. The
   * strum times are the score's `at`, or the skill interval of `manipulate`
   * (0.5 s novice to 0.15 s elite, provisional for guitar); strumming a chord.
   */
  export const strum: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["manipulate"]["strum"]
  > = AutoMovieMotionHumanActionRow.of("strum", manipulate, {
    hand: "right",
  });

  /**
   * Dialling: the right forefinger on each key in turn; one key every 0.5 s at
   * novice skill to 0.15 s at elite ({@link manipulate}, Salthouse 1986) unless
   * the contacts give their times.
   */
  export const dial: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["manipulate"]["dial"]
  > = AutoMovieMotionHumanActionRow.of("dial", manipulate, {
    hand: "right",
    digit: "index",
  });

  /**
   * Texting with a thumb. Over a carrier, give the sites in `contacts` and hold
   * the prop beforehand with the thumb free. A site without travel is pressed
   * on its surface. The carrier must yield the holding thumb. As a standalone
   * action the right thumb presses an unheld pad.
   *
   * One touch every 0.5 s at novice skill to 0.15 s at elite (`manipulate`, a
   * typing interval, provisional for thumbs) unless the contacts give their
   * times; texting.
   */
  export const thumbText: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["manipulate"]["thumbText"]
  > = AutoMovieMotionHumanActionRow.of(
    "thumbText",
    {
      ...manipulate,
      overlay: true,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanManipulate.IParams>,
      ): IAutoMovieMotionHumanActionPlan =>
        context.carrier === undefined
          ? manipulate.plan(context)
          : manipulateHeld(context),
    },
    { hand: "right", digit: "thumb" },
  );
}

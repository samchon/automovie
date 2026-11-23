import type { IAutoMovieMotionHumanPlayWindInstrument } from "../daily/IAutoMovieMotionHumanPlayWindInstrument";
import type { IAutoMovieMotionHumanGuitarChord } from "../handling/IAutoMovieMotionHumanGuitarChord";
import type { IAutoMovieMotionHumanGuitarNote } from "../handling/IAutoMovieMotionHumanGuitarNote";
import type { IAutoMovieMotionHumanPianoPedal } from "../handling/IAutoMovieMotionHumanPianoPedal";
import type { IAutoMovieMotionHumanPianoPerformance } from "../handling/IAutoMovieMotionHumanPianoPerformance";
import type { IAutoMovieMotionHumanPianoScore } from "../handling/IAutoMovieMotionHumanPianoScore";
import type { IAutoMovieMotionHumanBowViolinParams } from "../music/IAutoMovieMotionHumanBowViolinParams";
import type { IAutoMovieMotionHumanConduct } from "../music/IAutoMovieMotionHumanConduct";
import type { IAutoMovieMotionHumanCymbalStrike } from "../tasks/IAutoMovieMotionHumanCymbalStrike";
import type { IAutoMovieMotionHumanSideDrumStrike } from "../tasks/IAutoMovieMotionHumanSideDrumStrike";

/**
 * Playing and conducting music: wind, bowed string, plucked string, keyboard and percussion instruments, and the conductor's baton.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 */
export interface IAutoMovieMotionHumanInstrument<Chain> {
  /**
   * Playing pose of a held bugle, with the modeled mouthpiece at the lips.
   *
   * @param params The `prop`, `side`, `delay`, `prepare`, `seconds` and `retract` of `IAutoMovieMotionHumanPlayWindInstrument.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  playWindInstrument(
    params: IAutoMovieMotionHumanInstrument.IPlayWindInstrument,
    anchor?: string,
  ): Chain;

  /**
   * Conducting with a held baton: its tip beats the standard figure of the meter on the beat clock, the ictus, the tip's lowest point of each beat, falling on the beat's instant.
   *
   * @param params The `baton`, `meter`, `bars`, `bpm`, `lock` and `side` of `IAutoMovieMotionHumanConduct.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  conduct(params: IAutoMovieMotionHumanConduct.IParams, anchor?: string): Chain;

  /**
   * Bow a violin string.
   *
   * @param params The `bow`, `violin`, `string`, `direction` and `seconds` of `IAutoMovieMotionHumanBowViolinParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  bowViolin(
    params: IAutoMovieMotionHumanBowViolinParams,
    anchor?: string,
  ): Chain;

  /**
   * Fret and pluck one guitar note.
   *
   * @param params The `prop`, `fret`, `string`, `stopAt`, `pluckAt`, `releaseAt` and `duration` of `IAutoMovieMotionHumanGuitarNote`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  guitarNote(params: IAutoMovieMotionHumanGuitarNote, anchor?: string): Chain;

  /**
   * Strum a guitar chord.
   *
   * @param params The `prop`, `direction`, `stopAt`, `sweepStartAt`, `sweepEndAt`, `releaseAt` and `duration` of `IAutoMovieMotionHumanGuitarChord`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  guitarChord(params: IAutoMovieMotionHumanGuitarChord, anchor?: string): Chain;

  /**
   * Play a score of piano notes.
   *
   * @param params The `prop` and `notes` of `IAutoMovieMotionHumanPianoScore`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  pianoScore(params: IAutoMovieMotionHumanPianoScore, anchor?: string): Chain;

  /**
   * Press and release a piano pedal.
   *
   * @param params The `prop`, `presses` and `duration` of `IAutoMovieMotionHumanPianoPedal`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  pianoPedal(params: IAutoMovieMotionHumanPianoPedal, anchor?: string): Chain;

  /**
   * Play a piano score with its pedal.
   *
   * @param params The `pedal` of `IAutoMovieMotionHumanPianoPerformance`, with those of `IAutoMovieMotionHumanPianoScore`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  pianoPerformance(
    params: IAutoMovieMotionHumanPianoPerformance,
    anchor?: string,
  ): Chain;

  /**
   * Strike a side drum.
   *
   * @param params The `stick`, `drum` and `hand` of `IAutoMovieMotionHumanSideDrumStrike`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  sideDrumStrike(
    params: IAutoMovieMotionHumanSideDrumStrike,
    anchor?: string,
  ): Chain;

  /**
   * Strike a cymbal.
   *
   * @param params The `stick`, `cymbal` and `hand` of `IAutoMovieMotionHumanCymbalStrike`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  cymbalStrike(
    params: IAutoMovieMotionHumanCymbalStrike,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Instrument methods.
 */
export namespace IAutoMovieMotionHumanInstrument {
  /**
   * The parameters of `playWindInstrument`: `IAutoMovieMotionHumanPlayWindInstrument.IParams`, the type its law takes.
   */
  export type IPlayWindInstrument =
    IAutoMovieMotionHumanPlayWindInstrument.IParams;
}

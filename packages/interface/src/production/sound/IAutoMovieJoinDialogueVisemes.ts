import type { IAutoMovieProductionDialogueLine } from "../IAutoMovieProductionDialogueLine";
import type { IAutoMovieProductionViseme } from "../IAutoMovieProductionViseme";
import type { IAutoMovieDialogueSpeakerBinding } from "./IAutoMovieDialogueSpeakerBinding";

/** Inputs of binding a line's timed visemes to its speaker's actor. */
export namespace IAutoMovieJoinDialogueVisemes {
  /**
   * A line, the film's speaker bindings and the line's timed visemes.
   *
   * Engine's `joinAutoMovieDialogueVisemes` places each viseme on the emission
   * clock: frame = `line.startFrame + sample × fps / sourceSampleRate`, without
   * propagation delay. A missing speaker, absent binding or several matching
   * bindings returns a not-run outcome with no timeline. A selected binding
   * needs a nonblank actor; the line needs a positive whole-frame span, the
   * visemes increasing, nonoverlapping sample intervals within the line's
   * samples, and the rates positive. Empty timing and every violation throw.
   * Pauses between visemes become explicit `sil` ranges. The result owns new
   * range records.
   */
  export type IProps = {
    /** Borrowed dialogue line, placed from its start frame. */
    line: IAutoMovieProductionDialogueLine;

    /**
     * Borrowed speaker-to-actor bindings in authored order; exactly one speaker
     * match is required for an available timeline.
     */
    bindings: readonly IAutoMovieDialogueSpeakerBinding[];

    /**
     * Borrowed timed visemes from `productionPhonemesToVisemes`, in spoken
     * order.
     */
    visemes: readonly IAutoMovieProductionViseme[];

    /**
     * The line's model-native sample rate in samples per second, the clock of
     * the visemes' sample bounds.
     */
    sourceSampleRate: number;

    /** Film frames per second. */
    fps: number;
  };
}

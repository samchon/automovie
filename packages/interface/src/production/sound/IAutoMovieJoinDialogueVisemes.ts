import type { IAutoMovieProductionDialogueLine } from "../IAutoMovieProductionDialogueLine";
import type { IAutoMovieProductionSoundPlan } from "../IAutoMovieProductionSoundPlan";
import type { IAutoMovieProductionViseme } from "../IAutoMovieProductionViseme";
import type { IAutoMovieDialogueSpeakerBinding } from "./IAutoMovieDialogueSpeakerBinding";

/** Inputs of binding a line's timed visemes to its speaker's actor. */
export namespace IAutoMovieJoinDialogueVisemes {
  /**
   * A line, the film's speaker bindings, the line's timed visemes and the clock
   * the line plays on.
   *
   * Engine's `joinAutoMovieDialogueVisemes` places each viseme on the emission
   * clock, the clock the mix places the line's samples on, without propagation
   * delay: the decoded line holds `round(sourceSamples × clock.sampleRate /
   * sourceSampleRate)` samples from the start frame's sample tick, a viseme
   * bound `s` plays at that offset scaled by `s / sourceSamples`, and frame
   * boundaries sit on their nearest sample ticks, as the speech span's end
   * frame does. A missing speaker, absent binding or several matching bindings
   * returns a not-run outcome with no timeline. A selected binding needs a
   * nonblank actor; the line needs a positive whole-frame span, the visemes
   * increasing, nonoverlapping sample intervals within `[0, sourceSamples]` and
   * the line's span, and the rates and the count positive. Empty timing and
   * every violation throw. Pauses between visemes become explicit `sil` ranges.
   * The result owns new range records.
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

    /**
     * The line's sample count at `sourceSampleRate`, the receipt's
     * `sourceSamples`, a positive safe integer.
     */
    sourceSamples: number;

    /**
     * The film clock and the mix's sample rate the line is placed on: `fps`,
     * the exact `frameRate` when it is fractional, and `sampleRate`.
     */
    clock: Pick<
      IAutoMovieProductionSoundPlan,
      "fps" | "frameRate" | "sampleRate"
    >;
  };
}

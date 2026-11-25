/**
 * Cue tracks: the named instants for speech, music and staged actions, to sync
 * to and cut on (`IAutoMovieMotionHumanPerformance.IInput.cues`).
 *
 * The screenplay and the score decide these instants; nothing here listens to
 * audio or guesses a stress. A track is a list of named film seconds, so a
 * production may also write one by hand for anything else that happens at a
 * known time.
 */
export namespace IAutoMovieMotionHumanCue {
  /**
   * Timing for successive sections along an authored path or for sections
   * responding at authored film seconds. The list order is the cue index.
   */
  export type ISectionWave =
    | {
        /**
         * Nondecreasing, finite nonnegative film seconds. Equal seconds cue
         * sections together.
         */
        seconds: readonly number[];
        distances?: never;
        from?: never;
        speed?: never;
      }
    | {
        seconds?: never;
        /**
         * Nondecreasing finite nonnegative distances in metres along the path.
         * Equal marks cue sections together.
         */
        distances: readonly number[];
        /** Finite nonnegative film second when the wave reaches the path origin. */
        from: number;
        /** Finite positive propagation speed in metres per second. */
        speed: number;
      };

  /**
   * A beat track: `beat` at every beat and `downbeat` at the first beat of
   * every bar, so `{ event: "beat", index: 5 }` is the sixth beat and `{ event:
   * "downbeat", index: 1 }` the start of the second bar. A score's pulse.
   */
  export interface IBeats {
    /**
     * Tempo, beats per minute. A walk that keeps step takes one step a beat:
     * 120 is the drill's quick time and 180 its double time (`HumanGait.MARCH`,
     * `HumanGait.DOUBLE`).
     */
    bpm: number;

    /** Film second of the first beat, which is a downbeat; 0 when absent. */
    from?: number;

    /** How many beats the track holds. */
    count: number;

    /** Beats in a bar; 4 when absent. */
    meter?: number;
  }

  /**
   * A dialogue track: for each line `lineStart`, its `accent`s and
   * `phraseEnd`s, and `lineEnd`, in film order across the lines, so `{ event:
   * "accent", index: 3 }` is the fourth stressed syllable of the scene and `{
   * event: "lineEnd", index: 0 }` the end of the first line. One spoken line.
   */
  export interface ILine {
    /** Film second the line starts. */
    from: number;

    /** Film second it ends. */
    to: number;

    /** Film seconds of its stressed syllables, in order; none when absent. */
    accents?: readonly number[];

    /** Film seconds its phrases end inside the line, in order; none when absent. */
    phrases?: readonly number[];
  }

  /**
   * A command track: for each order its preparatory word `${word}Caution` (when
   * it has one) and its word of execution `${word}`, in film order, as drill
   * gives a command in two parts (US Army TC 3-21.5: the preparatory command
   * and the command of execution). An action synced to a word with `latency:
   * "reaction"` is warned when its preparatory word is on the track. The words'
   * seconds are the screenplay's. One spoken command.
   */
  export interface IOrder {
    /**
     * The command's name, which names its instants: the word of execution is
     * `${word}` and the preparatory word `${word}Caution`.
     */
    word: string;

    /** Film second of the word of execution. */
    at: number;

    /** Seconds the preparatory word comes before it; none when absent. */
    caution?: number;
  }

  /**
   * Published instants of something that is not an action: a ride's footfalls,
   * a band's cues.
   */
  export interface IInstants {
    /** The instants, each named, at film seconds. */
    instants: readonly {
      /** Cue label used by synchronisation lookup. */
      label: string;
      /** Cue instant in performance seconds. */
      seconds: number;
    }[];
  }
}

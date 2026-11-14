import type { resolveAutoMovieSchedule } from "@automovie/engine";

/**
 * Cue tracks: the named instants of a film's speech and music, for actions
 * to be synced to and cut on (`HumanPerformance.IInput.cues`).
 *
 * The screenplay and the score decide these instants; nothing here listens
 * to audio or guesses a stress. A track is a list of named film seconds, so
 * a production may also write one by hand for anything else that happens at
 * a known time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a track is, who decides its instants and what is out of scope.
 * @evidence contracts/development/design.md#principled-representation A track is the schedule's own list of named instants, so cues are addressed exactly as an action's events are.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two tracks a film has, a score's beats and a dialogue's lines, and their inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No instant is derived from a guessed speech rate; an accent is given or absent.
 */
export namespace HumanCue {
  /** A score's pulse. */
  export interface IBeats {
    /** Tempo, beats per minute. */
    bpm: number;

    /** Film second of the first beat, which is a downbeat; 0 when absent. */
    from?: number;

    /** How many beats the track holds. */
    count: number;

    /** Beats in a bar; 4 when absent. */
    meter?: number;
  }

  /** One spoken line. */
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
   * A beat track: `beat` at every beat and `downbeat` at the first beat of
   * every bar, so `{ event: "beat", index: 5 }` is the sixth beat and
   * `{ event: "downbeat", index: 1 }` the start of the second bar.
   *
   * @param beats The tempo, the first beat, the count and the meter.
   * @returns The track.
   * @throws {Error} When the tempo is not positive, or the count or the meter is not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two event names, how they index and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Beat `i` falls `60 / bpm` seconds after beat `i - 1`, each computed from the first beat so no error accumulates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the beats.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The inputs are validated; the meter's default is the common time the member documents.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the beat count, which is the output's size.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new list and retains nothing.
   */
  export function beats(beats: IBeats): resolveAutoMovieSchedule.ICue[] {
    const meter: number = beats.meter ?? 4;
    if (!(beats.bpm > 0))
      throw new Error("A beat track needs a positive tempo");
    for (const [name, value] of [
      ["count", beats.count],
      ["meter", meter],
    ] as const)
      if (!(Number.isInteger(value) && value > 0))
        throw new Error(`A beat track's ${name} is a positive whole number`);
    const track: resolveAutoMovieSchedule.ICue[] = [];
    for (let i: number = 0; i < beats.count; ++i) {
      const seconds: number = (beats.from ?? 0) + (i * 60) / beats.bpm;
      if (i % meter === 0) track.push({ name: "downbeat", seconds });
      track.push({ name: "beat", seconds });
    }
    return track;
  }

  /**
   * A dialogue track: for each line `lineStart`, its `accent`s and
   * `phraseEnd`s, and `lineEnd`, in film order across the lines, so
   * `{ event: "accent", index: 3 }` is the fourth stressed syllable of the
   * scene and `{ event: "lineEnd", index: 0 }` the end of the first line.
   *
   * @param lines The lines, in the order spoken.
   * @returns The track.
   * @throws {Error} When a line ends before it starts, or an accent or a phrase end lies outside its line.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four event names, how they index and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each line contributes its own instants, checked to lie inside it; the track is ordered by time, an earlier line first on a tie.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the lines and one stable sort.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No accent is invented for a line that gives none.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A sort of the instants, which are few.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new list and retains nothing.
   */
  export function dialogue(
    lines: readonly ILine[],
  ): resolveAutoMovieSchedule.ICue[] {
    const track: resolveAutoMovieSchedule.ICue[] = [];
    lines.forEach((line: ILine, index: number): void => {
      if (!(line.to >= line.from))
        throw new Error(`Line ${index} ends before it starts`);
      const inside = (name: string, list: readonly number[] = []): void => {
        for (const seconds of list) {
          if (!(seconds >= line.from && seconds <= line.to))
            throw new Error(
              `Line ${index} has ${name === "accent" ? "an accent" : "a phrase end"} at ${seconds} s, outside its ${line.from} to ${line.to} s`,
            );
          track.push({ name, seconds });
        }
      };
      track.push({ name: "lineStart", seconds: line.from });
      inside("accent", line.accents);
      inside("phraseEnd", line.phrases);
      track.push({ name: "lineEnd", seconds: line.to });
    });
    return track
      .map((cue, order) => ({ cue, order }))
      .sort((a, b) => a.cue.seconds - b.cue.seconds || a.order - b.order)
      .map((each) => each.cue);
  }
}

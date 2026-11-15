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

  /** One spoken command. */
  export interface IOrder {
    /** The command's name, which names its instants: the word of execution is `${word}` and the preparatory word `${word}Caution`. */
    word: string;

    /** Film second of the word of execution. */
    at: number;

    /** Seconds the preparatory word comes before it; none when absent. */
    caution?: number;
  }

  /** Published instants of something that is not an action: a ride's footfalls, a band's cues. */
  export interface IInstants {
    /** The instants, each named, at film seconds. */
    instants: readonly { label: string; seconds: number }[];
  }

  /**
   * A command track: for each order its preparatory word `${word}Caution`
   * (when it has one) and its word of execution `${word}`, in film order, as
   * drill gives a command in two parts (US Army TC 3-21.5: the preparatory
   * command and the command of execution). An action synced to a word with
   * `latency: "reaction"` is warned when its preparatory word is on the
   * track. The words' seconds are the screenplay's.
   *
   * @param orders The commands, in the order given.
   * @returns The track.
   * @throws {Error} When a second is not finite, a caution is not positive, a preparatory word falls before the film, or one falls at or before an earlier command's word of execution, naming both words.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the event names, the source of the two parts and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each order contributes its two instants; the track is ordered by time, an earlier order first on a tie.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One validation pass, one loop and one stable sort.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No interval between words is invented: every second is given.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A sort of the instants, which are few.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new list and retains nothing.
   */
  export function orders(
    orders: readonly IOrder[],
  ): resolveAutoMovieSchedule.ICue[] {
    const track: { cue: resolveAutoMovieSchedule.ICue; order: number }[] = [];
    const sorted: IOrder[] = [...orders].sort((a: IOrder, b: IOrder): number => a.at - b.at);
    sorted.forEach((order: IOrder, i: number): void => {
      if (!Number.isFinite(order.at))
        throw new Error(`The command ${order.word} has no finite second`);
      if (order.caution !== undefined) {
        if (!(order.caution > 0))
          throw new Error(`The command ${order.word}'s preparatory word comes ${order.caution} s before it; a positive time is expected`);
        const caution: number = order.at - order.caution;
        if (caution < 0)
          throw new Error(`The command ${order.word}'s preparatory word would fall at ${caution.toFixed(3)} s, before the film begins`);
        const before: IOrder | undefined = sorted[i - 1];
        if (before !== undefined && caution <= before.at)
          throw new Error(
            `The command ${order.word}'s preparatory word at ${caution.toFixed(3)} s falls at or before the word of execution of ${before.word} at ${before.at.toFixed(3)} s`,
          );
        track.push({ cue: { name: `${order.word}Caution`, seconds: caution }, order: 2 * i });
      }
      track.push({ cue: { name: order.word, seconds: order.at }, order: 2 * i + 1 });
    });
    return track
      .sort((a, b) => a.cue.seconds - b.cue.seconds || a.order - b.order)
      .map((each) => each.cue);
  }

  /**
   * A cue track from published instants, read structurally from anything
   * that publishes them (an archetype ride's footfalls and gait changes), so
   * a rider, a squadron's riders or a dancer read a support's or a band's
   * events without this package importing what publishes them.
   *
   * @param source What publishes the instants.
   * @param names The labels to keep; every label when absent.
   * @returns The track, in time order, each instant under its label.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and why it is read structurally.
   * @evidence contracts/development/implementation.md#principled-implementation Each kept instant becomes a cue of its label; the track is ordered by time, the source's order kept on a tie.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter, one map and one stable sort.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is renamed or invented.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A sort of the instants.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new list and retains nothing.
   */
  export function instants(
    source: IInstants,
    names?: readonly string[],
  ): resolveAutoMovieSchedule.ICue[] {
    return source.instants
      .filter((i: { label: string }): boolean => names === undefined || names.includes(i.label))
      .map((i: { label: string; seconds: number }, order: number) => ({ cue: { name: i.label, seconds: i.seconds }, order }))
      .sort((a, b) => a.cue.seconds - b.cue.seconds || a.order - b.order)
      .map((each) => each.cue);
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

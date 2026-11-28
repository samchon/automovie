import type {
  IAutoMovieMotionHumanCue,
  IAutoMovieScheduleCue,
} from "@automovie/interface";

/**
 * Cue tracks: the named instants for speech, music and staged actions, to sync
 * to and cut on (`AutoMovieMotionHumanPerformance.IInput.cues`).
 *
 * The screenplay and the score decide these instants; nothing here listens to
 * audio or guesses a stress. A track is a list of named film seconds, so a
 * production may also write one by hand for anything else that happens at a
 * known time.
 */
export namespace AutoMovieMotionHumanCue {
  /**
   * Emit one `section` cue per authored section, addressed by its zero-based
   * index. Sections may share an authored film second. With path distances, a
   * section responds at `from + distance / speed`.
   *
   * A stadium wave passes from section to section ([Farkas, Helbing and Vicsek,
   * 2002](https://doi.org/10.1038/419131a)). Commencement can cue several
   * sections together ([Penn's ceremony
   * instructions](https://commencement.upenn.edu/graduates)).
   *
   * @param wave The sections' film seconds or their distances, origin second
   *   and speed.
   * @returns A cue track ready for `AutoMovieMotionHumanPerformance` or the schedule resolver.
   * @throws {Error} If timing sources conflict, the list is empty, values are
   *   outside the documented ranges, or computed seconds are nonfinite or fail
   *   to advance at distinct distances.
   */
  export function sectionWave(
    wave: IAutoMovieMotionHumanCue.ISectionWave,
  ): IAutoMovieScheduleCue[] {
    const {
      seconds,
      distances,
      from,
      speed,
    }: IAutoMovieMotionHumanCue.ISectionWave = wave;
    if (
      seconds !== undefined &&
      (distances !== undefined || from !== undefined || speed !== undefined)
    )
      throw new Error("A section wave needs exactly one timing source");

    const values: readonly number[] | undefined = seconds ?? distances;
    if (values === undefined || values.length === 0)
      throw new Error("A section wave needs at least one section");

    let origin: number = 0;
    let rate: number = 1;
    if (seconds === undefined) {
      if (from === undefined || !(from >= 0))
        throw new Error(
          "A section wave needs a finite nonnegative origin second",
        );
      if (speed === undefined || !(speed > 0))
        throw new Error("A section wave needs a finite positive speed");
      origin = from;
      rate = speed;
    }

    const track: IAutoMovieScheduleCue[] = [];
    let previous: number = 0;
    let previousSecond: number = origin;
    for (let index: number = 0; index < values.length; ++index) {
      const value: number = values[index]!;
      if (!(value >= 0))
        throw new Error(`Section ${index} needs a finite nonnegative value`);
      if (value < previous) throw new Error(`Section ${index} is out of order`);

      const at: number = seconds === undefined ? origin + value / rate : value;
      if (value > previous && at <= previousSecond)
        throw new Error(
          `Section ${index} needs a finite, advancing film second`,
        );

      track.push({ name: "section", seconds: at });
      previous = value;
      previousSecond = at;
    }
    return track;
  }

  /**
   * A command track: for each order its preparatory word `${word}Caution` (when
   * it has one) and its word of execution `${word}`, in film order, as drill
   * gives a command in two parts (US Army TC 3-21.5: the preparatory command
   * and the command of execution). An action synced to a word with `latency:
   * "reaction"` is warned when its preparatory word is on the track. The words'
   * seconds are the screenplay's.
   *
   * @param orders The commands, in the order given.
   * @returns The track.
   * @throws {Error} When a second is not finite, a caution is not positive, a
   *   preparatory word falls before the film, or one falls at or before an
   *   earlier command's word of execution, naming both words.
   */
  export function orders(
    orders: readonly IAutoMovieMotionHumanCue.IOrder[],
  ): IAutoMovieScheduleCue[] {
    const track: IOrdersTrackItem[] = [];
    const sorted: IAutoMovieMotionHumanCue.IOrder[] = [...orders].sort(
      (
        a: IAutoMovieMotionHumanCue.IOrder,
        b: IAutoMovieMotionHumanCue.IOrder,
      ): number => a.at - b.at,
    );
    sorted.forEach(
      (order: IAutoMovieMotionHumanCue.IOrder, i: number): void => {
        if (order.caution !== undefined) {
          if (!(order.caution > 0))
            throw new Error(
              `The command ${order.word}'s preparatory word comes ${order.caution} s before it; a positive time is expected`,
            );
          const caution: number = order.at - order.caution;
          if (caution < 0)
            throw new Error(
              `The command ${order.word}'s preparatory word would fall at ${caution.toFixed(3)} s, before the film begins`,
            );
          const before: IAutoMovieMotionHumanCue.IOrder | undefined =
            sorted[i - 1];
          if (before !== undefined && caution <= before.at)
            throw new Error(
              `The command ${order.word}'s preparatory word at ${caution.toFixed(3)} s falls at or before the word of execution of ${before.word} at ${before.at.toFixed(3)} s`,
            );
          track.push({
            cue: { name: `${order.word}Caution`, seconds: caution },
            order: 2 * i,
          });
        }
        track.push({
          cue: { name: order.word, seconds: order.at },
          order: 2 * i + 1,
        });
      },
    );
    return track
      .sort((a, b) => a.cue.seconds - b.cue.seconds || a.order - b.order)
      .map((each) => each.cue);
  }

  /**
   * A cue track from published instants, read structurally from anything that
   * publishes them (an archetype ride's footfalls and gait changes), so a
   * rider, a squadron's riders or a dancer read a support's or a band's events
   * without this package importing what publishes them.
   *
   * @param source What publishes the instants.
   * @param names The labels to keep; every label when absent.
   * @returns The track, in time order, each instant under its label.
   */
  export function instants(
    source: IAutoMovieMotionHumanCue.IInstants,
    names?: readonly string[],
  ): IAutoMovieScheduleCue[] {
    return source.instants
      .filter(
        (i: IInstantsI): boolean =>
          names === undefined || names.includes(i.label),
      )
      .map((i: IInstantsI2, order: number) => ({
        cue: { name: i.label, seconds: i.seconds },
        order,
      }))
      .sort((a, b) => a.cue.seconds - b.cue.seconds || a.order - b.order)
      .map((each) => each.cue);
  }

  /**
   * Emit a beat track, with a downbeat preceding the first beat of each bar.
   *
   * Supply a finite positive tempo in beats per minute and a positive safe
   * integer beat count. The finite first film second defaults to 0 and the
   * positive safe integer meter defaults to four beats per bar. Read the sixth beat as
   * `{ event: "beat", index: 5 }` and the second bar's first beat as
   * `{ event: "downbeat", index: 1 }`.
   *
   * Throws if an input is invalid, a cue second is unrepresentable, or the
   * number of cues exceeds array capacity.
   */
  export function beats(
    beats: IAutoMovieMotionHumanCue.IBeats,
  ): IAutoMovieScheduleCue[] {
    const { bpm, count }: IAutoMovieMotionHumanCue.IBeats = beats;
    const from: number = beats.from ?? 0;
    const meter: number = beats.meter ?? 4;
    if (!Number.isFinite(bpm) || bpm <= 0)
      throw new Error("A beat track needs a positive finite tempo");
    for (const [name, value] of [
      ["count", count],
      ["meter", meter],
    ] as const)
      if (!Number.isSafeInteger(value) || value <= 0)
        throw new Error(`A beat track's ${name} must be a positive safe integer`);
    if (!Number.isFinite(from))
      throw new Error("A beat track's first second must be finite");
    if (!Number.isFinite(from + ((count - 1) * 60) / bpm))
      throw new Error("A beat track's last second must be finite");
    if (count + Math.ceil(count / meter) > 2 ** 32 - 1)
      throw new Error("A beat track's cue count exceeds array capacity");

    const track: IAutoMovieScheduleCue[] = [];
    for (let i: number = 0; i < count; ++i) {
      const seconds: number = from + (i * 60) / bpm;
      if (i % meter === 0) track.push({ name: "downbeat", seconds });
      track.push({ name: "beat", seconds });
    }
    return track;
  }

  /**
   * A dialogue track: for each line `lineStart`, its `accent`s and
   * `phraseEnd`s, and `lineEnd`, in film order across the lines, so `{ event:
   * "accent", index: 3 }` is the fourth stressed syllable of the scene and `{
   * event: "lineEnd", index: 0 }` the end of the first line.
   *
   * @param lines The lines, in the order spoken.
   * @returns The track.
   * @throws {Error} When a line ends before it starts, or an accent or a phrase
   *   end lies outside its line.
   */
  export function dialogue(
    lines: readonly IAutoMovieMotionHumanCue.ILine[],
  ): IAutoMovieScheduleCue[] {
    const track: IAutoMovieScheduleCue[] = [];
    lines.forEach(
      (line: IAutoMovieMotionHumanCue.ILine, index: number): void => {
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
      },
    );
    return track
      .map((cue, order) => ({ cue, order }))
      .sort((a, b) => a.cue.seconds - b.cue.seconds || a.order - b.order)
      .map((each) => each.cue);
  }
}

/*
 * The record of `IInstantsI2`'s site.
 */
type IInstantsI2 = { label: string; seconds: number };

/*
 * The record of `IInstantsI`'s site.
 */
type IInstantsI = { label: string };

/*
 * The record of `IOrdersTrackItem`'s site.
 */
type IOrdersTrackItem = { cue: IAutoMovieScheduleCue; order: number };

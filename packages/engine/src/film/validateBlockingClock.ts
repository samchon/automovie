import type {
  IAutoMovieBeat,
  IAutoMovieBlocking,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/** The identity and duration of the beat the blocking chooses. */
type BlockingClock = Pick<IAutoMovieBlocking, "beat" | "duration">;

/**
 * Locate duplicate beat ids, the unknown selected beat, and its nonpositive
 * duration.
 */
export function validateBlockingClock(
  out: IAutoMovieViolationCollector,
  beats: readonly Pick<IAutoMovieBeat, "id">[],
  clock: BlockingClock,
): void {
  const beatIds: Map<string, number> = new Map();
  beats.forEach(({ id }, index: number): void => {
    const existing: number | undefined = beatIds.get(id);
    if (existing !== undefined) {
      out.push(
        "type",
        `$script.beats[${index}].id`,
        `script beat id "${id}" is duplicated; first declared at $script.beats[${existing}].id`,
        id,
      );
      return;
    }
    beatIds.set(id, index);
  });
  if (!beatIds.has(clock.beat))
    out.push(
      "type",
      "$input.beat",
      `beat "${clock.beat}" must be one of the script's beats`,
      clock.beat,
    );
  if (!(clock.duration > 0))
    out.push(
      "range",
      "$input.duration",
      `beat duration must be a finite number > 0 seconds, but was ${clock.duration}`,
      clock.duration,
    );
}

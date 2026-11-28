import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieCaptureSubject,
  IAutoMoviePlaybackEvent,
} from "@automovie/interface";

/* A source id can recur across entries. An exact entry disambiguates that identity. */
export function resolveCaptureCue(
  subject: Pick<
    IAutoMovieCaptureSubject,
    "name" | "durationSeconds" | "playedCues"
  >,
  cue: IAutoMovieCapturePlanRequest.ICue,
): Readonly<IAutoMoviePlaybackEvent> {
  const matching: readonly IAutoMoviePlaybackEvent[] = (
    subject.playedCues ?? []
  ).filter((event: IAutoMoviePlaybackEvent): boolean => event.id === cue.id);
  const candidates: readonly IAutoMoviePlaybackEvent[] =
    cue.entry === undefined
      ? matching
      : matching.filter(
          (event: IAutoMoviePlaybackEvent): boolean =>
            event.entry === cue.entry,
        );
  if (candidates.length !== 1) {
    const listed: string = matching
      .map(
        (event: IAutoMoviePlaybackEvent): string =>
          `entry ${event.entry} at ${event.globalTime} s`,
      )
      .join(", ");
    if (candidates.length === 0)
      throw new Error(
        `Subject ${subject.name} has no played cue "${cue.id}"${cue.entry === undefined ? "" : ` at entry ${cue.entry}`}.${listed.length === 0 ? "" : ` Available: ${listed}.`}`,
      );
    throw new Error(
      `Subject ${subject.name} plays cue "${cue.id}" more than once: ${listed}. Supply entry to choose one occurrence.`,
    );
  }
  const selected: IAutoMoviePlaybackEvent = candidates[0]!;
  if (
    !Number.isSafeInteger(selected.entry) ||
    selected.entry < 0 ||
    !Number.isFinite(selected.shotTime) ||
    selected.shotTime < 0 ||
    selected.time !== selected.shotTime ||
    !Number.isFinite(subject.durationSeconds) ||
    subject.durationSeconds <= 0 ||
    !Number.isFinite(selected.globalTime) ||
    selected.globalTime < 0 ||
    selected.globalTime > subject.durationSeconds
  )
    throw new Error(
      `Subject ${subject.name} has invalid source timing for played cue "${cue.id}".`,
    );
  return structuredClone(selected);
}

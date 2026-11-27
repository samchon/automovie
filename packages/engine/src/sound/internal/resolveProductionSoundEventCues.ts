import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieDeriveProductionSoundPlan,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionSoundEvent,
  IAutoMovieShotEventContract,
} from "@automovie/interface";

/** Resolve adopted source trims against already retained picture events. */
export function resolveProductionSoundEventCues(
  props: IAutoMovieDeriveProductionSoundPlan.IProps,
  events: readonly IAutoMovieProductionSoundEvent[],
): IAutoMovieFilmTimeline["tracks"]["audio"] {
  if (props.eventCues === undefined || props.eventCues.length === 0) return [];

  const byTarget: Map<string, IAutoMovieProductionSoundEvent[]> = new Map();
  for (const occurrence of events) {
    const key: string = JSON.stringify([occurrence.shot, occurrence.event]);
    const group: IAutoMovieProductionSoundEvent[] = byTarget.get(key) ?? [];
    if (group.length === 0) byTarget.set(key, group);
    group.push(occurrence);
  }

  const usedIds: Set<string> = new Set(
    props.timeline.tracks.audio.map(
      (cue: IAutoMovieFilmTimeline["tracks"]["audio"][number]): string =>
        cue.id,
    ),
  );
  const authoredIds: Set<string> = new Set();
  const resolved: IAutoMovieFilmTimeline["tracks"]["audio"] = [];
  for (const cue of props.eventCues) {
    const {
      id,
      shot,
      event,
      offsetFrames,
      ...source
    }: IAutoMovieDeriveProductionSoundPlan.IEventCue = cue;
    if (usedIds.has(id) || authoredIds.has(id))
      throw new Error(`Event sound cue "${id}" repeats an authored cue id.`);
    authoredIds.add(id);

    const declarations: number | undefined = props.contracts
      .get(shot)
      ?.events.filter(
        (candidate: IAutoMovieShotEventContract): boolean =>
          candidate.id === event,
      ).length;
    const samples: number | undefined = props.compiled
      .get(shot)
      ?.eventSamples.filter(
        (
          sample: IAutoMovieCompiledShotSource["eventSamples"][number],
        ): boolean => sample.id === event,
      ).length;
    if (declarations !== 1 || samples !== 1)
      throw new Error(
        `Event sound cue "${id}" requires one declared and realized event "${event}" in shot "${shot}".`,
      );

    if (props.eventCueAssets?.has(source.asset) !== true)
      throw new Error(
        `Event sound cue "${id}" references undeclared adopted asset "${source.asset}".`,
      );
    if (
      source.durationFrames <= 0 ||
      source.sourceDurationFrames <= 0 ||
      source.sourceOffsetFrame < 0 ||
      source.sourceOffsetFrame + source.durationFrames >
        source.sourceDurationFrames
    )
      throw new Error(
        `Event sound cue "${id}" must read a positive whole-frame trim inside asset "${source.asset}".`,
      );

    if (source.gain < 0 || source.gain > 4)
      throw new Error(
        `Event sound cue "${id}" requires finite gain in [0, 4].`,
      );
    if (
      source.fadeInFrames < 0 ||
      source.fadeOutFrames < 0 ||
      source.fadeInFrames + source.fadeOutFrames > source.durationFrames
    )
      throw new Error(
        `Event sound cue "${id}" requires non-negative whole-frame fades whose sum fits the cue span.`,
      );

    const occurrences: readonly IAutoMovieProductionSoundEvent[] =
      byTarget.get(JSON.stringify([shot, event])) ?? [];
    for (const occurrence of occurrences) {
      const startFrame: number = occurrence.frame + offsetFrames;
      const endFrame: number = startFrame + source.durationFrames;
      if (startFrame < 0 || endFrame > props.timeline.totalFrames)
        throw new Error(
          `Event sound cue "${id}" at "${occurrence.id}" must fit inside the film.`,
        );

      const occurrenceId: string = JSON.stringify([id, occurrence.id]);
      if (usedIds.has(occurrenceId) || authoredIds.has(occurrenceId))
        throw new Error(`Event sound cue "${id}" produces a duplicate mix id.`);
      usedIds.add(occurrenceId);
      resolved.push({
        ...source,
        id: occurrenceId,
        startFrame,
      });
    }
  }
  return resolved;
}

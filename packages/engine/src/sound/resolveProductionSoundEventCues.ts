import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieDeriveProductionSoundPlan,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionSoundEvent,
  IAutoMovieShotEventContract,
} from "@automovie/interface";

/**
 * Resolve adopted source trims against already retained picture events.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns the join from declared shot and event ids to each retained film frame and returns normalized audio placements for the same plan lowering as fixed cues.
 * @evidence contracts/development/implementation.md#principled-implementation Adds a signed integral offset to the existing picture frame and admits the half-open placement against the film extent.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Indexes retained occurrences once, then validates each authoring cue and expands it into mix placements in the incoming event order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Distinguishes an unknown or ambiguous realization from a trimmed occurrence, refuses ambiguous ids and film overflow, and checks adopted asset identity, source trim, gain and fades even for removed occurrences. PCM availability belongs to mixing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Uses a linear event index and output expansion, plus a declaration/sample scan for each requested cue. Storage is linear in retained events, consumed authored and fixed cue ids, and expanded output.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the plan's already projected event frames and original mix payload, with no second frame conversion or motion sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The identity index and sets are local, each output cue owns only scalar fields, and no decoder or external resource is acquired.
 */
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
      (cue: IAutoMovieFilmTimeline["tracks"]["audio"][number]): string => cue.id,
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
        (sample: IAutoMovieCompiledShotSource["eventSamples"][number]): boolean =>
          sample.id === event,
      ).length;
    if (declarations !== 1 || samples !== 1)
      throw new Error(
        `Event sound cue "${id}" requires one declared and realized event "${event}" in shot "${shot}".`,
      );
    if (!Number.isSafeInteger(offsetFrames))
      throw new Error(`Event sound cue "${id}" requires a whole-frame offset.`);

    if (props.eventCueAssets?.has(source.asset) !== true)
      throw new Error(
        `Event sound cue "${id}" references undeclared adopted asset "${source.asset}".`,
      );
    if (
      !Number.isSafeInteger(source.durationFrames) ||
      source.durationFrames <= 0 ||
      !Number.isSafeInteger(source.sourceDurationFrames) ||
      source.sourceDurationFrames <= 0 ||
      !Number.isSafeInteger(source.sourceOffsetFrame) ||
      source.sourceOffsetFrame < 0 ||
      source.sourceOffsetFrame + source.durationFrames >
        source.sourceDurationFrames
    )
      throw new Error(
        `Event sound cue "${id}" must read a positive whole-frame trim inside asset "${source.asset}".`,
      );

    if (!Number.isFinite(source.gain) || source.gain < 0 || source.gain > 4)
      throw new Error(
        `Event sound cue "${id}" requires finite gain in [0, 4].`,
      );
    if (
      !Number.isSafeInteger(source.fadeInFrames) ||
      source.fadeInFrames < 0 ||
      !Number.isSafeInteger(source.fadeOutFrames) ||
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
      if (
        !Number.isSafeInteger(startFrame) ||
        !Number.isSafeInteger(endFrame) ||
        startFrame < 0 ||
        endFrame > props.timeline.totalFrames
      )
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

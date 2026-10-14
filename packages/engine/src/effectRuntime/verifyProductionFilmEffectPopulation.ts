import {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { productionFilmEffectEditFingerprint } from "./productionFilmEffectEditFingerprint";
import { productionFilmEffectTimelineFrameRate } from "./productionFilmEffectTimelineFrameRate";
import { sortProductionFilmEffectCues } from "./sortProductionFilmEffectCues";
import { validateProductionFilmEffectRuntime } from "./validateProductionFilmEffectRuntime";

type FilmEffectCue = IAutoMovieFilmTimeline["tracks"]["effects"][number];

/**
 * Prove that one persisted runtime population is the exact executable projection of the current timeline's effect track.
 *
 * Per-entry identity checks cannot see an entry that is absent, so an empty or truncated runtime array would otherwise read as current. The population must match the canonically ordered cue set one to one, every entry must pass `validateProductionFilmEffectRuntime`, and every entry must carry the timeline's film id, `inputFingerprint`, edit fingerprint and reduced frame rate together with its cue's id, zone, frame interval and intensity. The timeline does not name its production, so the `production` field is left to the sampler's identity comparison. An inconsistent timeline clock throws `film-effect-input-invalid`; every population mismatch throws `film-effect-runtime-invalid`.
 *
 * @evidence contracts/common.md#principled-implementation Sorts expected cues through sortProductionFilmEffectCues and compares the supplied runtime entries in their original order. Equal length and positional equality of id, zone, interval and intensity require an already canonical population; sorting the supplied entries would hide the reordered-population fault. Each entry's digests are recomputed before its fields are trusted.
 * @evidence contracts/common.md#clear-and-simple-design The function owns only the population question; ordering, rate resolution, edit identity and per-entry shape are delegated to the same functions the writer uses, so the reader checks exactly what was written.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No entry is matched by searching for its id, so a reordered, duplicated or extra entry cannot pass, and an empty population is refused unless the track is empty; the unchecked `production` field is a stated gap because the timeline carries no production id.
 * @evidence contracts/common.md#meaningful-documentation States why a population check is needed beyond per-entry checks, the one-to-one ordering rule, every field compared and where its expected value comes from, why `production` is not compared, and the two refusal codes.
 * @evidence contracts/performance.md#efficient-algorithms For C cues, one edit fingerprint and C runtime validations traverse their serialized records and sort every object's keys, adding sum(K log K) for each object's K keys; cue ordering adds O(C log C). The length check precedes per-entry digest work, so a truncated population fails cheaply.
 * @evidence contracts/performance.md#reuse-equivalent-work The rate, edit fingerprint and sorted cue list are computed once per call and shared by every entry; nothing is cached between calls because the timeline is a mutable caller-owned record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds one sorted copy of the cue array and the per-entry canonical strings only during the call, and retains nothing afterwards.
 */
export function verifyProductionFilmEffectPopulation(props: {
  timeline: IAutoMovieFilmTimeline;
  effects: readonly IAutoMovieCompiledFilmEffect[];
}): void {
  const frameRate: IAutoMovieProductionFrameRate =
    productionFilmEffectTimelineFrameRate(props.timeline);
  const editFingerprint: string = productionFilmEffectEditFingerprint(
    props.timeline,
  );
  const cues: FilmEffectCue[] = sortProductionFilmEffectCues(
    props.timeline.tracks.effects,
  );
  if (props.effects.length !== cues.length)
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-runtime-invalid",
      `Film effect runtime population has ${props.effects.length} entries; the current timeline requires ${cues.length}.`,
    );
  for (let index: number = 0; index < props.effects.length; index++) {
    const runtime: IAutoMovieCompiledFilmEffect | undefined =
      props.effects[index];
    if (runtime === undefined)
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-runtime-invalid",
        `Film effect runtime entry ${index} is absent from the current timeline population.`,
      );
    const cue: FilmEffectCue = cues[index]!;
    validateProductionFilmEffectRuntime(runtime);
    if (
      runtime.film !== props.timeline.id ||
      runtime.compileFingerprint !== props.timeline.inputFingerprint ||
      runtime.editFingerprint !== editFingerprint ||
      runtime.frameRate.numerator !== frameRate.numerator ||
      runtime.frameRate.denominator !== frameRate.denominator ||
      runtime.effect.id !== cue.id ||
      runtime.effect.zone !== cue.zone ||
      runtime.startFrame !== cue.startFrame ||
      runtime.endFrame !== cue.startFrame + cue.durationFrames ||
      runtime.effect.intensity.from !== cue.intensity ||
      runtime.effect.intensity.to !== cue.intensity
    )
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-runtime-invalid",
        `Film effect runtime entry ${index} differs from current timeline cue "${cue.id}" in identity, clock, zone, interval, or intensity.`,
      );
  }
}

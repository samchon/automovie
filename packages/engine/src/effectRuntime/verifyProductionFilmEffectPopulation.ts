import {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionFrameRate,
  type IAutoMovieVerifyProductionFilmEffectPopulation,
} from "@automovie/interface";

import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { productionFilmEffectEditFingerprint } from "./productionFilmEffectEditFingerprint";
import { productionFilmEffectTimelineFrameRate } from "./productionFilmEffectTimelineFrameRate";
import { sortProductionFilmEffectCues } from "./sortProductionFilmEffectCues";
import { validateProductionFilmEffectRuntime } from "./validateProductionFilmEffectRuntime";

type FilmEffectCue = IAutoMovieFilmTimeline["tracks"]["effects"][number];

/**
 * Prove that one persisted runtime population is the exact executable
 * projection of the current timeline's effect track.
 *
 * Per-entry identity checks cannot see an entry that is absent, so an empty or
 * truncated runtime array would otherwise read as current. The population must
 * match the canonically ordered cue set one to one, every entry must pass
 * `validateProductionFilmEffectRuntime`, and every entry must carry the
 * timeline's film id, `inputFingerprint`, edit fingerprint and reduced frame
 * rate together with its cue's id, zone, frame interval and intensity. The
 * timeline does not name its production, so the `production` field is left to
 * the sampler's identity comparison. An inconsistent timeline clock throws
 * `film-effect-input-invalid`; every population mismatch throws
 * `film-effect-runtime-invalid`.
 */
export function verifyProductionFilmEffectPopulation(
  props: IAutoMovieVerifyProductionFilmEffectPopulation.IProps,
): void {
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

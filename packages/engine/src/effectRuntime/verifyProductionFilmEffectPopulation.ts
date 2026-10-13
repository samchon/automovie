import {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";

import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { productionFilmEffectEditFingerprint } from "./productionFilmEffectEditFingerprint";
import { productionFilmEffectTimelineFrameRate } from "./productionFilmEffectTimelineFrameRate";
import { sortProductionFilmEffectCues } from "./sortProductionFilmEffectCues";
import { validateProductionFilmEffectRuntime } from "./validateProductionFilmEffectRuntime";

/**
 * Prove that one persisted runtime population is the exact executable
 * projection of the current timeline's effect track.
 *
 * Per-entry identity checks cannot see an entry that is absent, so an empty
 * or truncated runtime array would otherwise read as current. The population
 * must match the canonically ordered cue set one to one, and every entry must
 * carry the timeline's film, compile, edit, and frame-rate identity together
 * with its cue's zone, interval, and intensity.
 */
export const verifyProductionFilmEffectPopulation = (props: {
  timeline: IAutoMovieFilmTimeline;
  effects: readonly IAutoMovieCompiledFilmEffect[];
}): void => {
  const frameRate = productionFilmEffectTimelineFrameRate(props.timeline);
  const editFingerprint = productionFilmEffectEditFingerprint(props.timeline);
  const cues = sortProductionFilmEffectCues(props.timeline.tracks.effects);
  if (props.effects.length !== cues.length)
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-runtime-invalid",
      `Film effect runtime population has ${props.effects.length} entries; the current timeline requires ${cues.length}.`,
    );
  props.effects.forEach((runtime, index) => {
    const cue = cues[index]!;
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
  });
};

import { IAutoMovieLight, IAutoMovieProductionLighting } from "@automovie/interface";
import { resolveShotLighting } from "../resolve/resolveShotLighting";

/**
 * The production's lights at one STORY-clock instant.
 *
 * Deliberately {@link resolveShotLighting} rather than a resolver of its own: a
 * production source is an ordinary light addressed by an ordinary pointer
 * track, so it is sampled, bounds-checked, accumulated per light and folded
 * back by exactly the code a shot's `lightMotions` runs through. A second
 * implementation is a second set of rounding, a second clamp policy at the ends
 * of a clip, and eventually a second answer to the same question — the split
 * the light-channel table exists to prevent. A source no clip touches comes
 * back by identity, inherited straight through.
 *
 * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-time-sampling resolveProductionLighting samples every production light on the common story clock before lowering the active photometric state.
 * @evidence requirements/lighting/temporal-state-and-continuity.md#lighting-state-time-sampling resolveProductionLighting samples production-light clips directly at the supplied story second rather than advancing playback state.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-sampling-refusal resolveProductionLighting resolves declared light state at an explicit shot-local time and refuses invalid source sampling.
 * @evidence specifications/camera-light-and-visibility/temporal-state-and-continuity.md#clv-light-cue-observation resolveProductionLighting supplies one explicit story-clock sample to every production-light channel.
 */
export const resolveProductionLighting = (props: {
  /** The production's declared sources and their story-clock motion. */
  lighting: IAutoMovieProductionLighting;

  /** The instant to evaluate, in story-clock seconds. */
  storySeconds: number;
}): IAutoMovieLight[] =>
  resolveShotLighting({
    lights: props.lighting.lights,
    clips: props.lighting.motions,
    seconds: props.storySeconds,
  });

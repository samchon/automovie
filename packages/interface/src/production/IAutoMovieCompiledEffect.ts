import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieEffectRecipe } from "./IAutoMovieEffectRecipe";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";
import { IAutoMovieShotEffectCue } from "./IAutoMovieShotEffectCue";

/**
 * Compiler-owned deterministic effect runtime consumed by viewer and oracle.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `IAutoMovieCompiledEffect` as the portable data boundary for the rendering runtime build order requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `IAutoMovieCompiledEffect` for the spec render state isolation system contract.
 */
export interface IAutoMovieCompiledEffect {
  /**
   * Generated effect format.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `version` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `version` for the spec render state isolation system contract.
   */
  version: 1;

  /**
   * Stable source cue id.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `id` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `id` for the spec render state isolation system contract.
   */
  id: string;

  /**
   * Existing world zone id.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `zone` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `zone` for the spec render state isolation system contract.
   */
  zone: string;

  /**
   * Supported primitive effect family.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `kind` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `kind` for the spec render state isolation system contract.
   */
  kind: IAutoMovieEffectRecipe["kind"];

  /**
   * Exact world-space emitter bounds.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `bounds` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `bounds` for the spec render state isolation system contract.
   */
  bounds: IAutoMovieWorldDesign["effectZones"][number]["bounds"];

  /**
   * Domain-separated deterministic stream seed.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `seed` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `seed` for the spec render state isolation system contract.
   */
  seed: number;

  /**
   * Exact current recipe.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `recipe` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `recipe` for the spec render state isolation system contract.
   */
  recipe: IAutoMovieEffectRecipe;

  /**
   * Inclusive shot-local cue start.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `start` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `start` for the spec render state isolation system contract.
   */
  start: number;

  /**
   * Exclusive shot-local cue end.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `end` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `end` for the spec render state isolation system contract.
   */
  end: number;

  /**
   * Bounded cue intensity envelope.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `intensity` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `intensity` for the spec render state isolation system contract.
   */
  intensity: IAutoMovieShotEffectCue["intensity"];

  /**
   * Bound authoritative event, when present.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `event` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `event` for the spec render state isolation system contract.
   */
  event?: string;

  /**
   * Production frame-clock simulation step.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `fixedStepSeconds` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `fixedStepSeconds` for the spec render state isolation system contract.
   */
  fixedStepSeconds: number;

  /**
   * Digest of every field above except this digest.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-build-order Exposes `digest` as the portable data boundary for the rendering runtime build order requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `digest` for the spec render state isolation system contract.
   */
  digest: AutoMovieContentDigest;
}

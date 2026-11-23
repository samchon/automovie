import type { IAutoMovieEffectRecipe } from "./IAutoMovieEffectRecipe";
import type { IAutoMovieShotEffectCue } from "./IAutoMovieShotEffectCue";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Compiler-owned deterministic effect runtime consumed by viewer and oracle.
 * Bounds are world-space metres; cue boundaries and simulation step are
 * seconds.
 */
export interface IAutoMovieCompiledEffect {
  /** Generated effect format. */
  version: 1;

  /** Stable source cue id. */
  id: string;

  /** Existing world zone id. */
  zone: string;

  /** Supported primitive effect family. */
  kind: IAutoMovieEffectRecipe["kind"];

  /** Exact world-space emitter bounds. */
  bounds: IAutoMovieWorldDesign["effectZones"][number]["bounds"];

  /** Domain-separated deterministic stream seed. */
  seed: number;

  /** Exact current recipe. */
  recipe: IAutoMovieEffectRecipe;

  /** Inclusive shot-local cue start. */
  start: number;

  /** Exclusive shot-local cue end. */
  end: number;

  /** Bounded cue intensity envelope. */
  intensity: IAutoMovieShotEffectCue["intensity"];

  /** Bound authoritative event, when present. */
  event?: string;

  /** Production frame-clock simulation step. */
  fixedStepSeconds: number;

  /** Digest of every field above except this digest. */
  digest: string;
}

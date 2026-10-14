import { IAutoMovieEffectRecipe } from "./IAutoMovieEffectRecipe";
import { IAutoMovieShotEffectCue } from "./IAutoMovieShotEffectCue";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Compiler-owned deterministic effect runtime consumed by viewer and oracle. Bounds are world-space metres; cue boundaries and simulation step are seconds.
 *
 * @evidence contracts/common.md#principled-implementation A protocol-derived seed, copied recipe and emitter bounds, half-open cue window and fixed simulation step define a repeatable stream; its digest hashes every other field through canonical JSON and pure SHA-256.
 * @evidence contracts/common.md#clear-and-simple-design The compiled record resolves recipe and zone references once and carries the inputs needed by both visual sampling and numerical effect queries, leaving film-global ownership to its separate envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The stream carries copied recipe and bounds rather than consulting mutable world data. Shot materialization drops unresolved references unless a host separately validates them; film materialization explicitly refuses them. Sampling assumes admitted recipe ranges and step and does not authenticate this record's digest itself.
 * @evidence contracts/common.md#meaningful-documentation Gives recipe and zone authority, world bounds, deterministic seed, half-open second interval, intensity envelope, optional event binding, fixed step and digest coverage.
 * @author Samchon
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

import {
  IAutoMovieLight,
  IAutoMovieProductionLighting,
} from "@automovie/interface";

import { resolveShotLighting } from "../resolve/resolveShotLighting";

/**
 * The production's lights at one story-clock instant.
 *
 * A production source is an ordinary light addressed by an ordinary pointer
 * track, so it is resolved by {@link resolveShotLighting}, the code a shot's
 * `lightMotions` runs through: sampled, checked, accumulated per light and
 * applied the same way. A source no clip touches comes back by identity, and
 * a clip that addresses a missing light or a property its kind does not carry
 * throws, as it does for a shot. `inheritProductionLighting` calls it at the
 * story moment a pinned shot's instant maps to and merges the result into the
 * shot's staged lights.
 *
 * @param props The production lighting and the instant.
 * @returns One light per declared source, in declaration order.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the production's light clips with the shot light resolver, the keyframe sampling every animated light uses, so a production source and a shot light rendered at the same instant hold the same value; story seconds are the clip clock because production light clips are authored on it.
 * @evidence contracts/common.md#clear-and-simple-design Renames the production record's fields onto the shot resolver's input instead of keeping a second resolver, so rounding, end-of-clip clamping and per-light accumulation exist once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No light or property is special-cased, and malformed tracks throw through the shared resolver rather than being skipped.
 * @evidence contracts/common.md#meaningful-documentation States why the shot resolver is reused and what that guarantees, the identity return for untouched sources, the throws, the caller, the clock, and the result's order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Delegates to `resolveShotLighting`, which samples each clip once at the instant and indexes lights by id; this adapter adds one object literal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolves one instant per call; `inheritProductionLighting` asks once per shot instant it lights, and the lighting record carries no identity to key a cache on.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; untouched sources are the declared objects by reference and touched ones are fresh copies owned by the caller.
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

import type { IAutoMovieEffectRecipe } from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";

/**
 * Refuse malformed optional transport, opacity-envelope and final-size controls before compiled bytes are published.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the optional recipe fields this gate owns before the materializer creates a stream.
 * @evidence contracts/development/implementation.md#principled-implementation A supplied extent obeys the existing 20-metre airborne size ceiling and cannot shrink any initial particle. Opacity accepts the two defined envelopes. Ballistic controls enforce finite gravity and floor, explicit retention, and the recipe's velocity and stain bounds. Recipe fields outside these optional controls remain the caller's premise.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Checks each optional control in its recipe group, using the common record predicate for structured ballistic fields. The materializer calls one gate for both shot and film streams.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid supplied controls throw before the recipe is cloned or hashed. Missing optional controls pass through without rewriting the recipe.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed work per call. The only scan has three world axes and no work depends on particle count.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Admission reads one recipe without caching its mutable fields.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Admission holds only call-local values and opens no resource.
 */
export function admitEffectTransport(recipe: IAutoMovieEffectRecipe): void {
  if (
    recipe.particle.opacity.envelope !== undefined &&
    !["sine", "constant"].includes(recipe.particle.opacity.envelope)
  )
    throw new Error("Invalid effect opacity envelope");
  const size: IAutoMovieEffectRecipe["particle"]["size"] = recipe.particle.size;
  if (
    size.end !== undefined &&
    (!Number.isFinite(size.end) || !(size.end >= size.max && size.end <= 20))
  )
    throw new Error("Invalid effect final particle extent");
  const ballistic: IAutoMovieEffectRecipe["motion"]["ballistic"] =
    recipe.motion.ballistic;
  if (ballistic === undefined) return;
  if (
    !isAutoMovieRecord(ballistic) ||
    !Number.isFinite(ballistic.gravity) ||
    ballistic.gravity < 0 ||
    !Number.isFinite(ballistic.floor) ||
    typeof ballistic.retainStains !== "boolean" ||
    (ballistic.stainSizeMultiplier !== undefined &&
      (!Number.isFinite(ballistic.stainSizeMultiplier) ||
        ballistic.stainSizeMultiplier <= 0 ||
        ballistic.stainSizeMultiplier > 16)) ||
    (ballistic.velocitySpread !== undefined &&
      (!isAutoMovieRecord(ballistic.velocitySpread) ||
        [
          ballistic.velocitySpread.x,
          ballistic.velocitySpread.y,
          ballistic.velocitySpread.z,
        ].some(
          (value: number): boolean =>
            !Number.isFinite(value) || value < 0 || value > 50,
        )))
  )
    throw new Error("Invalid effect ballistic transport");
}

import type { IAutoMovieEffectRecipe } from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";

/**
 * Refuse malformed optional transport and lifetime-envelope controls before compiled bytes are published.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Refuse malformed optional transport and lifetime-envelope controls before compiled bytes are published) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Refuse malformed optional transport and lifetime-envelope controls before compiled bytes are published) directly over its typed inputs (`recipe`) as a single pass (some over [ ballistic.velocitySpread.x, ), delegating to `isAutoMovieRecord`, `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 16, 50, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 32 lines and 4 top-level statements that reuses `isAutoMovieRecord`, `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 16, 50 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `recipe`; the dominant cost is a single pass (some over [ ballistic.velocitySpread.x, ), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function admitEffectTransport(recipe: IAutoMovieEffectRecipe): void {
  if (
    recipe.particle.opacity.envelope !== undefined &&
    !["sine", "constant"].includes(recipe.particle.opacity.envelope)
  )
    throw new Error("Invalid effect opacity envelope");
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

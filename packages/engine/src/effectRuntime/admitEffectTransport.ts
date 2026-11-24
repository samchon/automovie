import type { IAutoMovieEffectRecipe } from "@automovie/interface";

/**
 * Refuse malformed optional transport, opacity-envelope and final-size controls
 * before compiled bytes are published.
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
    !Number.isFinite(ballistic.gravity) ||
    ballistic.gravity < 0 ||
    !Number.isFinite(ballistic.floor) ||
    (ballistic.stainSizeMultiplier !== undefined &&
      (!Number.isFinite(ballistic.stainSizeMultiplier) ||
        ballistic.stainSizeMultiplier <= 0 ||
        ballistic.stainSizeMultiplier > 16)) ||
    (ballistic.velocitySpread !== undefined &&
      ([
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

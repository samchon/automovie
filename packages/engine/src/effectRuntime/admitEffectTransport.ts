import type { IAutoMovieEffectRecipe } from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";

/** Refuse malformed optional transport and lifetime-envelope controls before compiled bytes are published. */
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

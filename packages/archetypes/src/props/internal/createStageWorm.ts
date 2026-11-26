import type { AutoMovieArchetypeStageWorm } from "../AutoMovieArchetypeStageWorm";
import { type AutoMovieArchetype } from "../../core/index";
import { FIELD_IMPLEMENTS } from "../FIELD_IMPLEMENTS";
import { LongImplementDraw } from "../LongImplementDraw";

/**
 * Inert worm display prop with a shaft hold and an end marker.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createStageWorm(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeStageWorm.Affordance, AutoMovieArchetypeStageWorm.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<AutoMovieArchetypeStageWorm.Affordance>> =
    LongImplementDraw.prepare<AutoMovieArchetypeStageWorm.Affordance>("worm", params, seed);
  FIELD_IMPLEMENTS.build(
    builder,
    "worm",
    d.length!,
    d.shaftDiameter! / 2,
    d.mass!,
  );
  return builder.build(d.mass!);
}

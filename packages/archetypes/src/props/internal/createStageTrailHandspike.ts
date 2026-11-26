import type { AutoMovieArchetypeStageTrailHandspike } from "../AutoMovieArchetypeStageTrailHandspike";
import { type AutoMovieArchetype } from "../../core/index";
import { FIELD_IMPLEMENTS } from "../FIELD_IMPLEMENTS";
import { LongImplementDraw } from "../LongImplementDraw";

/**
 * Inert handspike display prop with a shaft hold and an end marker.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createStageTrailHandspike(
  params: Pick<LongImplementDraw.IParams, "id" | "length" | "mass"> = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageTrailHandspike.Affordance,
  AutoMovieArchetypeStageTrailHandspike.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof LongImplementDraw.prepare<AutoMovieArchetypeStageTrailHandspike.Affordance>
  > = LongImplementDraw.prepare<AutoMovieArchetypeStageTrailHandspike.Affordance>(
    "trailHandspike",
    params,
    seed,
  );
  FIELD_IMPLEMENTS.build(
    builder,
    "trailHandspike",
    d.length!,
    d.shaftDiameter! / 2,
    d.mass!,
  );
  return builder.build(d.mass!);
}

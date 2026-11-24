import { type AutoMovieArchetype } from "../core";
import { FIELD_IMPLEMENTS } from "./FIELD_IMPLEMENTS";
import { LongImplementDraw } from "./LongImplementDraw";

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
  seed?: number | string,
): AutoMovieArchetype<
  createStageTrailHandspike.Affordance,
  createStageTrailHandspike.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof LongImplementDraw.prepare<createStageTrailHandspike.Affordance>
  > = LongImplementDraw.prepare<createStageTrailHandspike.Affordance>(
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

/** The contacts and dimensions of {@link createStageTrailHandspike}. */
export namespace createStageTrailHandspike {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "shaft";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass";
}

import { type AutoMovieArchetype } from "../core";
import { FIELD_IMPLEMENTS } from "./FIELD_IMPLEMENTS";
import { LongImplementDraw } from "./LongImplementDraw";

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
): AutoMovieArchetype<createStageWorm.Affordance, createStageWorm.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<createStageWorm.Affordance>> =
    LongImplementDraw.prepare<createStageWorm.Affordance>("worm", params, seed);
  FIELD_IMPLEMENTS.build(
    builder,
    "worm",
    d.length!,
    d.shaftDiameter! / 2,
    d.mass!,
  );
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createStageWorm}. */
export namespace createStageWorm {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "shaft";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "shaftDiameter";
}

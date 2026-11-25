import { type AutoMovieArchetype } from "../core";
import { FIELD_IMPLEMENTS } from "./FIELD_IMPLEMENTS";
import { LongImplementDraw } from "./LongImplementDraw";

/**
 * Inert sponge-and-rammer prop with visible end markers and a shaft hold.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createStageSpongeRammer(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<
  createStageSpongeRammer.Affordance,
  createStageSpongeRammer.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof LongImplementDraw.prepare<createStageSpongeRammer.Affordance>
  > = LongImplementDraw.prepare<createStageSpongeRammer.Affordance>(
    "spongeRammer",
    params,
    seed,
  );
  FIELD_IMPLEMENTS.build(
    builder,
    "spongeRammer",
    d.length!,
    d.shaftDiameter! / 2,
    d.mass!,
  );
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createStageSpongeRammer}. */
export namespace createStageSpongeRammer {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "shaft" | "tip" | "rammer" | "sponge";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "shaftDiameter";
}

import type { AutoMovieArchetypeStageSpongeRammer } from "../AutoMovieArchetypeStageSpongeRammer";
import { type AutoMovieArchetype } from "../../core/index";
import { FIELD_IMPLEMENTS } from "../FIELD_IMPLEMENTS";
import { LongImplementDraw } from "../LongImplementDraw";

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
  AutoMovieArchetypeStageSpongeRammer.Affordance,
  AutoMovieArchetypeStageSpongeRammer.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof LongImplementDraw.prepare<AutoMovieArchetypeStageSpongeRammer.Affordance>
  > = LongImplementDraw.prepare<AutoMovieArchetypeStageSpongeRammer.Affordance>(
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

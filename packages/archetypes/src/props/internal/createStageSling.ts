import type { AutoMovieArchetypeStageSling } from "../AutoMovieArchetypeStageSling";
import { type AutoMovieArchetype } from "../../core/index";
import { LongImplementDraw } from "../LongImplementDraw";
import { Throwers } from "../Throwers";

/**
 * Inert sling prop with its original display pouch and hand contacts.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createStageSling(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "pouchLength" | "pouchWidth" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeStageSling.Affordance, AutoMovieArchetypeStageSling.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<AutoMovieArchetypeStageSling.Affordance>> =
    LongImplementDraw.prepare<AutoMovieArchetypeStageSling.Affordance>(
      "sling",
      params,
      seed,
    );
  Throwers.sling(builder, d);
  return builder.build(d.mass!);
}

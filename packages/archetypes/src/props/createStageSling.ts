import { type AutoMovieArchetype } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";
import { Throwers } from "./Throwers";

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
  seed?: number | string,
): AutoMovieArchetype<createStageSling.Affordance, createStageSling.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<createStageSling.Affordance>> =
    LongImplementDraw.prepare<createStageSling.Affordance>(
      "sling",
      params,
      seed,
    );
  Throwers.sling(builder, d);
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createStageSling}. */
export namespace createStageSling {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "grip" | "pouch" | "release";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "launchSpeed"
    | "length"
    | "mass"
    | "pouchLength"
    | "pouchWidth"
    | "shaftDiameter";
}

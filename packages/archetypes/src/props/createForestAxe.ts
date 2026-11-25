import { type AutoMovieArchetype } from "../core";
import { ForestAxe } from "./ForestAxe";
import { LongImplementDraw } from "./LongImplementDraw";

/**
 * Forest axe with a shaft hold and a head-face marker.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createForestAxe(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "edge" | "headLength" | "headMass" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<createForestAxe.Affordance, createForestAxe.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<createForestAxe.Affordance>> =
    LongImplementDraw.prepare<createForestAxe.Affordance>(
      "forestAxe",
      params,
      seed,
    );
  ForestAxe.build(builder, d);
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createForestAxe}. */
export namespace createForestAxe {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "shaft";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "edge"
    | "headLength"
    | "headMass"
    | "length"
    | "mass";
}

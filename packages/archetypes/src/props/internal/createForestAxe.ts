import type { AutoMovieArchetypeForestAxe } from "../AutoMovieArchetypeForestAxe";
import { type AutoMovieArchetype } from "../../core/index";
import { ForestAxe } from "./ForestAxe";
import { LongImplementDraw } from "./LongImplementDraw";

/*
 * Forest axe with a shaft hold and a head-face marker.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createForestAxe(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "edge" | "headLength" | "headMass" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeForestAxe.Affordance, AutoMovieArchetypeForestAxe.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<AutoMovieArchetypeForestAxe.Affordance>> =
    LongImplementDraw.prepare<AutoMovieArchetypeForestAxe.Affordance>(
      "forestAxe",
      params,
      seed,
    );
  ForestAxe.build(builder, d);
  return builder.build(d.mass!);
}

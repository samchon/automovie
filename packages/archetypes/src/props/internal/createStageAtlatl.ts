import type { AutoMovieArchetypeStageAtlatl } from "../AutoMovieArchetypeStageAtlatl";
import { type AutoMovieArchetype } from "../../core/index";
import { LongImplementDraw } from "./LongImplementDraw";
import { Throwers } from "./Throwers";

/*
 * Inert atlatl prop with its original display grip and end locator.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createStageAtlatl(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "width" | "spurSetback" | "gripSetback" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageAtlatl.Affordance,
  AutoMovieArchetypeStageAtlatl.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof LongImplementDraw.prepare<AutoMovieArchetypeStageAtlatl.Affordance>
  > = LongImplementDraw.prepare<AutoMovieArchetypeStageAtlatl.Affordance>(
    "atlatl",
    params,
    seed,
  );
  Throwers.atlatl(builder, d);
  return builder.build(d.mass!);
}

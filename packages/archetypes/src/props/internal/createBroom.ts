import type { AutoMovieArchetypeBroom } from "../AutoMovieArchetypeBroom";
import { type AutoMovieArchetype } from "../../core/index";
import { LongImplementDraw } from "./LongImplementDraw";

/*
 * Broom with a low brushing head and a two-hand shaft.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createBroom(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBroom.Affordance, AutoMovieArchetypeBroom.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<AutoMovieArchetypeBroom.Affordance>> =
    LongImplementDraw.prepare<AutoMovieArchetypeBroom.Affordance>("broom", params, seed);
  const radius: number = d.shaftDiameter! / 2;

  LongImplementDraw.groundTool(
    builder,
    {
      width: LongImplementDraw.HEAD_WIDTH,
      height: 0.08,
      depth: 0.05,
      color: "#c9a24a",
      density: 1,
    },
    { radius, top: d.length! },
  );
  return builder.build(d.mass!);
}

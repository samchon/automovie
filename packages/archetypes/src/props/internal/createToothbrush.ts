import type { AutoMovieArchetypeToothbrush } from "../AutoMovieArchetypeToothbrush";
import { type AutoMovieArchetype } from "../../core/index";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Toothbrush with a handle and a +Y bristle face near its far end.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createToothbrush(
  params: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeToothbrush.Affordance, AutoMovieArchetypeToothbrush.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<AutoMovieArchetypeToothbrush.Affordance>> =
    GroomingPropDraw.prepare<AutoMovieArchetypeToothbrush.Affordance>(
      "toothbrush",
      params,
      seed,
    );
  const length: number = d.length!;
  const width: number = d.width!;

  GroomingPropDraw.addHead(
    builder,
    { length, width, head: 0.028, across: width },
    { handle: "#3f8fc4", head: "#eef2f5" },
  );
  return builder.build(d.mass!);
}

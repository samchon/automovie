import { type AutoMovieArchetype } from "../core";
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
  seed?: number | string,
): AutoMovieArchetype<createToothbrush.Affordance, createToothbrush.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<createToothbrush.Affordance>> =
    GroomingPropDraw.prepare<createToothbrush.Affordance>(
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

/** The contacts and dimensions of {@link createToothbrush}. */
export namespace createToothbrush {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "width";
}

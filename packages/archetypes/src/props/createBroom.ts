import { type AutoMovieArchetype } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";

/**
 * Broom with a low brushing head and a two-hand shaft.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createBroom(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<createBroom.Affordance, createBroom.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<createBroom.Affordance>> =
    LongImplementDraw.prepare<createBroom.Affordance>("broom", params, seed);
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

/** The contacts and dimensions of {@link createBroom}. */
export namespace createBroom {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "shaft";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "shaftDiameter";
}

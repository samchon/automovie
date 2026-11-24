import { type AutoMovieArchetype } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";
import { Throwers } from "./Throwers";

/**
 * Inert atlatl prop with its original display grip and end locator.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createStageAtlatl(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "width" | "spurSetback" | "gripSetback" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<
  createStageAtlatl.Affordance,
  createStageAtlatl.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof LongImplementDraw.prepare<createStageAtlatl.Affordance>
  > = LongImplementDraw.prepare<createStageAtlatl.Affordance>(
    "atlatl",
    params,
    seed,
  );
  Throwers.atlatl(builder, d);
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createStageAtlatl}. */
export namespace createStageAtlatl {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "grip" | "spur";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "gripSetback"
    | "launchSpeed"
    | "length"
    | "mass"
    | "spurSetback"
    | "width";
}

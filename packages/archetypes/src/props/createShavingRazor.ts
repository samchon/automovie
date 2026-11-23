import { type AutoMovieArchetype } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Shaving razor scene prop with a grip and a +Y cartridge face.
 *
 * @param params The optional scene ID, manufacturer model, and handle diameter
 *   in metres.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createShavingRazor(
  params: Pick<GroomingPropDraw.IParams, "id" | "width"> & {
    model?: Extract<GroomingPropDraw.Model, "edwinJagger" | "gilletteMach3">;
  } = {},
  seed?: number | string,
): AutoMovieArchetype<
  createShavingRazor.Affordance,
  createShavingRazor.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof GroomingPropDraw.prepare<createShavingRazor.Affordance>
  > = GroomingPropDraw.prepare<createShavingRazor.Affordance>(
    "razor",
    params,
    seed,
  );
  const length: number = d.length!;
  const width: number = d.width!;

  GroomingPropDraw.addHead(
    builder,
    {
      length,
      width,
      head: GroomingPropDraw.CARTRIDGE.depth,
      across: GroomingPropDraw.CARTRIDGE.width,
    },
    { handle: "#2c2f33", head: "#b9bcc0" },
  );
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createShavingRazor}. */
export namespace createShavingRazor {
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

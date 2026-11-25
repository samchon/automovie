import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Screwdriver with a round grip and an axial tip along +Y.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createScrewdriver(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "blade"
  > = {},
  seed?: number,
): AutoMovieArchetype<
  createScrewdriver.Affordance,
  createScrewdriver.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<createScrewdriver.Affordance>> =
    HandToolDraw.prepare<createScrewdriver.Affordance>(
      "screwdriver",
      params,
      seed,
    );
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - d.blade!;
  HandToolDraw.handle(builder, handle, radius, { round: true });

  builder.rod(
    "shank",
    0.003,
    Vector3.create(0, handle, 0),
    Vector3.create(0, length, 0),
    { color: "#b9bcc0", density: 11 },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, length, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createScrewdriver}. */
export namespace createScrewdriver {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "blade" | "gripDiameter" | "length" | "mass";
}

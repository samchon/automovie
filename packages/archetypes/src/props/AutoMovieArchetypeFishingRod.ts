import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { LongImplementDraw } from "./internal/LongImplementDraw";

/** Creates a Daiwa Ninja X spinning rod archetype standing on its butt. */
export namespace AutoMovieArchetypeFishingRod {
/**
 * Fishing rod standing on its butt, with a lower grip and an axial tip.
 *
 * @param params The optional scene ID, shaft diameter in metres and Daiwa model
 *   of the rendered rod.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function create(
  params: AutoMovieArchetypeFishingRod.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeFishingRod.Affordance, AutoMovieArchetypeFishingRod.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<AutoMovieArchetypeFishingRod.Affordance>> =
    LongImplementDraw.prepare<AutoMovieArchetypeFishingRod.Affordance>(
      "fishingRod",
      params,
      seed,
    );
  const length: number = d.length!;
  const radius: number = d.shaftDiameter! / 2;

  // A rod on its butt: the grip a hand takes and the tip it casts with.
  const grip: number = LongImplementDraw.ROD_GRIP;
  builder.rod(
    "rod",
    radius,
    Vector3.create(0, 0, 0),
    Vector3.create(0, length, 0),
    {
      color: "#2c2f33",
    },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, grip / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
    length: grip,
  });
  builder.affordance({
    id: "tip",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, length, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}


  /* The contacts and dimensions of {@link AutoMovieArchetypeFishingRod}. */
  /**
   * The original producer parameters.
   */
  export interface IParams {
    /** The fishing rod identifier, unique within its scene. */
    id?: string;
    /** The shaft diameter in metres when fixed by the author. */
    shaftDiameter?: number;
    /** The Daiwa Ninja X spinning rod model; omitted for seeded selection. */
    model?: LongImplementDraw.Model;
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "grip" | "tip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "shaftDiameter";
}

import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { SmokingPropDraw } from "./SmokingPropDraw";

/**
 * Inert cigarette proxy with a pinch, filter contact and lit-end locator.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createCigarette(
  params: Pick<
    SmokingPropDraw.IParams,
    "id" | "length" | "diameter" | "filter" | "mass"
  > = {},
  seed?: number | string,
): AutoMovieArchetype<createCigarette.Affordance, createCigarette.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof SmokingPropDraw.prepare<createCigarette.Affordance>> =
    SmokingPropDraw.prepare<createCigarette.Affordance>(
      "cigarette",
      params,
      seed,
    );
  const radius: number = d.diameter! / 2;
  const filter: number = d.filter!;
  const length: number = d.length!;
  builder.rod(
    "filter",
    radius,
    Vector3.create(0, radius, 0),
    Vector3.create(0, radius, filter),
    { color: "#c98f4e" },
  );
  builder.rod(
    "paper",
    radius,
    Vector3.create(0, radius, filter),
    Vector3.create(0, radius, length),
    { color: "#f1efe8" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, radius, filter + 0.01),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: 2 * radius,
  });
  builder.affordance({
    id: "mouth",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, radius, 0),
      Vector3.create(0, 0, -1),
    ),
    extent: null,
  });
  builder.affordance({
    id: "flame",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, radius, length),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createCigarette}. */
export namespace createCigarette {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "flame" | "grip" | "mouth";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "filter" | "length" | "mass";
}

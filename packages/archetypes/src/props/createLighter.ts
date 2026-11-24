import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { SmokingPropDraw } from "./SmokingPropDraw";

/**
 * Digital pocket lighter with a grip, wheel, button and effect locator.
 *
 * @param params The optional scene ID and BIC model.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createLighter(
  params: Pick<SmokingPropDraw.IParams, "id"> & {
    model?: SmokingPropDraw.Model;
  } = {},
  seed?: number,
): AutoMovieArchetype<createLighter.Affordance, createLighter.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof SmokingPropDraw.prepare<createLighter.Affordance>> =
    SmokingPropDraw.prepare<createLighter.Affordance>("lighter", params, seed);
  const width: number = d.width!;
  const height: number = d.length!;
  const depth: number = d.diameter!;
  const wheel: number = depth * 0.3;
  builder.box(
    "body",
    Vector3.create(width, height - 2 * wheel, depth),
    Vector3.create(0, (height - 2 * wheel) / 2, 0),
    { color: "#c0392b" },
  );
  builder.rod(
    "wheel",
    wheel,
    Vector3.create(-width * 0.2, height - wheel, depth * 0.1),
    Vector3.create(width * 0.2, height - wheel, depth * 0.1),
    { color: "#8a8d91" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, (height - 2 * wheel) / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: depth,
    length: height - 2 * wheel,
  });
  builder.affordance({
    id: "wheel",
    kind: "knob",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, height - wheel, depth * 0.1),
      Vector3.create(1, 0, 0),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    travel: 90,
    parts: ["wheel"],
  });
  builder.affordance({
    id: "valve",
    kind: "button",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, height - 2 * wheel, -depth * 0.25),
    ),
    extent: null,
    travel: 0.003,
  });
  builder.affordance({
    id: "flame",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, height + 0.015, depth * 0.3),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createLighter}. */
export namespace createLighter {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "flame" | "grip" | "valve" | "wheel";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass" | "width";
}

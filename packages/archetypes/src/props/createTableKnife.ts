import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Table knife with a pinch grip and a food-side edge toward +Z.
 *
 * @param params The optional scene ID, grip diameter in metres and manufacturer
 *   model.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createTableKnife(
  params: Pick<HandToolDraw.IParams, "id" | "gripDiameter"> & {
    model?: HandToolDraw.Model;
  } = {},
  seed?: number | string,
): AutoMovieArchetype<createTableKnife.Affordance, createTableKnife.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<createTableKnife.Affordance>> =
    HandToolDraw.prepare<createTableKnife.Affordance>("knife", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - d.blade!;
  HandToolDraw.handle(builder, handle, radius, { precision: true });

  // The blade beyond the handle, its spine toward -Z and its edge toward +Z.
  const width: number = d.bladeWidth!;
  builder.box(
    "blade",
    Vector3.create(width * HandToolDraw.KNIFE_THICKNESS, d.blade!, width),
    Vector3.create(0, handle + d.blade! / 2, 0),
    { color: "#b9bcc0" },
  );
  builder.affordance({
    id: "face",
    kind: "ledge",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, handle + d.blade! / 2, width / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    length: d.blade!,
  });
  return builder.build(d.mass!);
}

/** The contacts and dimensions of {@link createTableKnife}. */
export namespace createTableKnife {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "blade"
    | "bladeWidth"
    | "gripDiameter"
    | "length"
    | "mass";
}

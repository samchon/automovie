import type { AutoMovieArchetypeShovel } from "../AutoMovieArchetypeShovel";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { LongImplementDraw } from "../LongImplementDraw";

/**
 * Shovel resting on its blade edge with a two-hand shaft and top D grip.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createShovel(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeShovel.Affordance, AutoMovieArchetypeShovel.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<AutoMovieArchetypeShovel.Affordance>> =
    LongImplementDraw.prepare<AutoMovieArchetypeShovel.Affordance>("shovel", params, seed);
  const radius: number = d.shaftDiameter! / 2;
  const length: number = d.length!;
  const top: number = length - 0.1;

  LongImplementDraw.groundTool(
    builder,
    {
      width: LongImplementDraw.BLADE_WIDTH,
      height: 0.29,
      depth: 0.004,
      color: "#6c7076",
      density: 8,
    },
    { radius, top },
  );

  // The D grip: a cross bar held from above, joined to the shaft by its yoke.
  builder.rod(
    "grip",
    radius,
    Vector3.create(-LongImplementDraw.D_GRIP / 2, length - radius, 0),
    Vector3.create(LongImplementDraw.D_GRIP / 2, length - radius, 0),
    { color: "#b98d5b" },
  );
  builder.box(
    "yoke",
    Vector3.create(0.12, 0.1 - 2 * radius, 0.01),
    Vector3.create(0, top + (0.1 - 2 * radius) / 2, 0),
    { color: "#b98d5b", density: 0.2 },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create(0, length - radius, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
    length: LongImplementDraw.D_GRIP,
  });
  return builder.build(d.mass!);
}

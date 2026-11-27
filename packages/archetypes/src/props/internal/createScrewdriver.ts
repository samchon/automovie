import type { AutoMovieArchetypeScrewdriver } from "../AutoMovieArchetypeScrewdriver";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { HandToolDraw } from "./HandToolDraw";

/*
 * Screwdriver with a round grip and an axial tip along +Y.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createScrewdriver(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "blade"
  > = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeScrewdriver.Affordance,
  AutoMovieArchetypeScrewdriver.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<AutoMovieArchetypeScrewdriver.Affordance>> =
    HandToolDraw.prepare<AutoMovieArchetypeScrewdriver.Affordance>(
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

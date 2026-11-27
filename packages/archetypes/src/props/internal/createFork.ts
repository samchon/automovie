import type { AutoMovieArchetypeFork } from "../AutoMovieArchetypeFork";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { HandToolDraw } from "./HandToolDraw";

/*
 * Fork with a pinch grip and a working tip along +Y.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createFork(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeFork.Affordance, AutoMovieArchetypeFork.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<AutoMovieArchetypeFork.Affordance>> =
    HandToolDraw.prepare<AutoMovieArchetypeFork.Affordance>("fork", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - HandToolDraw.TINES.length;
  HandToolDraw.handle(builder, handle, radius, {
    steel: true,
    precision: true,
  });

  // The tines are one flat plate on the handle's end, ending the fork's drawn length.
  const tines: Readonly<HandToolDraw.ITines> = HandToolDraw.TINES;
  builder.box(
    "tines",
    AutoMovieEngineVector3.create(tines.width, tines.length, 0.002),
    AutoMovieEngineVector3.create(0, handle + tines.length / 2, 0),
    { color: "#b9bcc0", surface: "steel" },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, length, 0),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!, { rests: "steel" });
}

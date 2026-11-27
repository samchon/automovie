import type { AutoMovieArchetypeCigarette } from "../AutoMovieArchetypeCigarette";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { SmokingPropDraw } from "./SmokingPropDraw";

/*
 * Inert cigarette proxy with a pinch, filter contact and lit-end locator.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createCigarette(
  params: Pick<
    SmokingPropDraw.IParams,
    "id" | "length" | "diameter" | "filter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCigarette.Affordance, AutoMovieArchetypeCigarette.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof SmokingPropDraw.prepare<AutoMovieArchetypeCigarette.Affordance>> =
    SmokingPropDraw.prepare<AutoMovieArchetypeCigarette.Affordance>(
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
    AutoMovieEngineVector3.create(0, radius, 0),
    AutoMovieEngineVector3.create(0, radius, filter),
    { color: "#c98f4e" },
  );
  builder.rod(
    "paper",
    radius,
    AutoMovieEngineVector3.create(0, radius, filter),
    AutoMovieEngineVector3.create(0, radius, length),
    { color: "#f1efe8" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, radius, filter + 0.01),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
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
      AutoMovieEngineVector3.create(0, radius, 0),
      AutoMovieEngineVector3.create(0, 0, -1),
    ),
    extent: null,
  });
  builder.affordance({
    id: "flame",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, radius, length),
      AutoMovieEngineVector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}

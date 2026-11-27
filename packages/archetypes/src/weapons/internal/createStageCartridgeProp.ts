import type { AutoMovieArchetypeStageCartridgeProp } from "../AutoMovieArchetypeStageCartridgeProp";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StageTokenConstruction } from "./StageTokenConstruction";


/*
 * Paper cylinder stage silhouette.
 *
 * A display cylinder with a precision hand contact at mid-height and an end
 * mark along +Y.
 * Parameter params: The scene id and this digital form's catalogue or sizing
 * options.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createStageCartridgeProp(
  params: AutoMovieArchetypeStageCartridgeProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageCartridgeProp.Affordance,
  AutoMovieArchetypeStageCartridgeProp.Dimension
> {
  return StageTokenConstruction("cartridge", params, seed, (builder, d) => {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    const r: number = d.diameter! / 2;
    builder.rod("paper", r, v(0, 0, 0), v(0, d.length!, 0), {
      color: "#d8cfb8",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, d.length! / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: d.diameter!,
    });
    builder.affordance({
      id: "end",
      kind: "surface",
      direction: "along",
      frame: AutoMovieArchetypeFrame.upright(v(0, d.length!, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  });
}

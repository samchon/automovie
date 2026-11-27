import type { AutoMovieArchetypeStageHammerProp } from "../AutoMovieArchetypeStageHammerProp";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StageShaftConstruction } from "./StageShaftConstruction";


/**
 * Padded offset stage hammer.
 *
 * A digital asymmetrical block marks the visible face above one hand contact.
 * Display height is along +Y.
 *
 * @param params The scene identity and optional total display height in metres.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageHammerProp(
  params: AutoMovieArchetypeStageHammerProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageHammerProp.Affordance,
  AutoMovieArchetypeStageHammerProp.Dimension
> {
  return StageShaftConstruction(
    "offsetHammer",
    params,
    seed,
    0.8,
    (builder, height) => {
      const v: typeof Vector3.create = Vector3.create;
      const width: number = 0.24 * height;
      const centre: number = 0.06 * height;
      builder.box(
        "ornament",
        v(width, 0.2 * height, 0.095 * height),
        v(centre, 0.9 * height, 0),
        { color: "#968ccc" },
      );
      builder.affordance({
        id: "face",
        kind: "surface",
        direction: "normal",
        frame: AutoMovieArchetypeFrame.facing(
          v(centre + width / 2, 0.9 * height, 0),
          v(1, 0, 0),
          v(0, 0, 1),
        ),
        extent: null,
      });
    },
  );
}

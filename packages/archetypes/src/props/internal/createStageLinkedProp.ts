import type { AutoMovieArchetypeStageLinkedProp } from "../AutoMovieArchetypeStageLinkedProp";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StageShaftConstruction } from "./StageShaftConstruction";


/*
 * Padded linked stage ornament.
 *
 * A shaft and visibly jointed distal ornament with a grip, hinge, and following
 * end mark.
 * Parameter params: The scene identity and optional total display height in metres.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createStageLinkedProp(
  params: AutoMovieArchetypeStageLinkedProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageLinkedProp.Affordance,
  AutoMovieArchetypeStageLinkedProp.Dimension
> {
  return StageShaftConstruction(
    "linked",
    params,
    seed,
    0.5,
    (builder, height, shaftTop, shaftRadius) => {
      const v: typeof Vector3.create = Vector3.create;
      const pivot: IAutoMovieVector3 = v(0, shaftTop, 0);
      const radius: number = 0.11 * height;
      const centre: IAutoMovieVector3 = v(0, height - radius, 0);
      builder.rod("connector", 0.32 * shaftRadius, pivot, centre, {
        color: "#bca6df",
      });
      builder.ball("ornament", radius, centre, { color: "#968ccc" });

      // The hinge turns about frame-local +Y, which faces out of the stage outline.
      builder.affordance({
        id: "link",
        kind: "hinge",
        frame: AutoMovieArchetypeFrame.facing(pivot, v(0, 0, 1), v(1, 0, 0)),
        extent: null,
        travel: 180,
        parts: ["connector", "ornament"],
      });
      builder.affordance({
        id: "end",
        kind: "surface",
        direction: "along",
        frame: AutoMovieArchetypeFrame.upright(v(0, height, 0)),
        extent: null,
        rides: "link",
      });
    },
  );
}

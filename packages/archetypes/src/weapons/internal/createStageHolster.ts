import type { AutoMovieArchetypeStageHolster } from "../AutoMovieArchetypeStageHolster";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StageCarrierConstruction } from "../StageCarrierConstruction";


/**
 * Worn belt holster silhouette.
 *
 * A separate little carrier with a raised or lowered socket and a wearer-facing
 * belt hook.
 *
 * @param params The scene id, optional display dimensions and this carrier's
 *   own fit options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageHolster(
  params: AutoMovieArchetypeStageHolster.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageHolster.Affordance,
  AutoMovieArchetypeStageHolster.Dimension
> {
  return StageCarrierConstruction("holster", params, seed, (builder, d) => {
    const v: typeof Vector3.create = Vector3.create;
    builder.box("loop", v(0.01, 0.06, 0.06), v(0, 0, 0), {
      color: "#2c2f33",
    });
    builder.box(
      "pouch",
      v(0.04, d.depth!, 0.07),
      v(0.025, d.ride! - d.depth! / 2, 0),
      { color: "#2c2f33" },
    );
    builder.affordance({
      id: "socket",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v(0.025, d.ride!, 0)),
      extent: null,
    });
    builder.affordance({
      id: "belt",
      kind: "hook",
      frame: StageCarrierConstruction.facingWearer(v(0, 0, 0)),
      extent: null,
    });
  });
}

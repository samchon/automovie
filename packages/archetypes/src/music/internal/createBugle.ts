import type { AutoMovieArchetypeBugle } from "../AutoMovieArchetypeBugle";
import type { AutoMovieArchetype } from "../../core/index";
import { InstrumentBuild } from "./InstrumentBuild";
import { MarchingConstruction } from "./MarchingConstruction";


/*
 * A bugle with a hand grip and lip socket.
 *
 * The bugle lies on its side with the bell toward +X. The mouthpiece is the
 * socket a wind performance meets.
 * Parameter params: The optional identifier and dimensions fixed within their
 * recorded bands.
 * Parameter seed: The seed for free dimensions. The band midpoints apply without a
 * seed.
 * Returns: The model with its named contacts in its local frame.
 * When a supplied dimension or choice
 * cannot be realized.
 */
export function createBugle(
  params: AutoMovieArchetypeBugle.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBugle.Affordance, AutoMovieArchetypeBugle.Dimension> {
  return InstrumentBuild.create<AutoMovieArchetypeBugle.Affordance>(
    "bugle",
    "bugle",
    params,
    seed,
    MarchingConstruction.bugle,
  );
}

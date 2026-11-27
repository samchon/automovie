import type { AutoMovieArchetypeSideDrum } from "../AutoMovieArchetypeSideDrum";
import type { AutoMovieArchetype } from "../../core/index";
import { InstrumentBuild } from "./InstrumentBuild";
import { MarchingConstruction } from "./MarchingConstruction";


/*
 * A side drum with separate batter-head and carrier contacts.
 *
 * The drum stands on its bottom head. The head surface accepts a stick contact
 * and sling marks the carrier hook.
 * Parameter params: The optional identifier and dimensions fixed within their
 * recorded bands.
 * Parameter seed: The seed for free dimensions. The band midpoints apply without a
 * seed.
 * Returns: The model with its named contacts in its local frame.
 * When a supplied dimension or choice
 * cannot be realized.
 */
export function createSideDrum(
  params: AutoMovieArchetypeSideDrum.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSideDrum.Affordance, AutoMovieArchetypeSideDrum.Dimension> {
  return InstrumentBuild.create<AutoMovieArchetypeSideDrum.Affordance>(
    "sideDrum",
    "side drum",
    params,
    seed,
    MarchingConstruction.sideDrum,
  );
}

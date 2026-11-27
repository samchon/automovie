import type { AutoMovieArchetypeUprightPiano } from "../AutoMovieArchetypeUprightPiano";
import type { AutoMovieArchetype } from "../../core/index";
import { InstrumentBuild } from "./InstrumentBuild";
import { KeyboardConstruction } from "./KeyboardConstruction";


/*
 * An upright piano with articulating keys, fallboard and damper pedal.
 *
 * The piano stands with its back at the origin's Z, its keyboard toward +Z and
 * the bass keys at -X. A foot presses damperPedal and each key has its own
 * travel.
 * Parameter params: The optional identifier and dimensions fixed within their
 * recorded bands.
 * Parameter seed: The seed for free dimensions. The band midpoints apply without a
 * seed.
 * Returns: The model with its named contacts in its local frame.
 * When a supplied dimension or choice
 * cannot be realized.
 */
export function createUprightPiano(
  params: AutoMovieArchetypeUprightPiano.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeUprightPiano.Affordance,
  AutoMovieArchetypeUprightPiano.Dimension
> {
  return InstrumentBuild.create<AutoMovieArchetypeUprightPiano.Affordance>(
    "uprightPiano",
    "upright piano",
    params,
    seed,
    KeyboardConstruction.uprightPiano,
  );
}

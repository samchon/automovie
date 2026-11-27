import type { AutoMovieArchetypeGuitar } from "../AutoMovieArchetypeGuitar";
import type { AutoMovieArchetype } from "../../core/index";
import { InstrumentBuild } from "./InstrumentBuild";
import { StringedConstruction } from "./StringedConstruction";


/*
 * A steel-string guitar with numbered fret and string contacts.
 *
 * The guitar lies on its back with the neck along +X, the body to -X and
 * string1 on its -Z edge. The neck and body contacts support fretting and
 * strumming.
 * Parameter params: The optional identifier and dimensions fixed within their
 * recorded bands.
 * Parameter seed: The seed for free dimensions. The band midpoints apply without a
 * seed.
 * Returns: The model with its named contacts in its local frame.
 * When a supplied dimension or choice
 * cannot be realized.
 */
export function createGuitar(
  params: AutoMovieArchetypeGuitar.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeGuitar.Affordance, AutoMovieArchetypeGuitar.Dimension> {
  return InstrumentBuild.create<AutoMovieArchetypeGuitar.Affordance>(
    "guitar",
    "guitar",
    params,
    seed,
    StringedConstruction.guitar,
  );
}

import type { AutoMovieArchetypeViolin } from "../AutoMovieArchetypeViolin";
import type { AutoMovieArchetype } from "../../core/index";
import { InstrumentBuild } from "../InstrumentBuild";
import { StringedConstruction } from "../StringedConstruction";


/**
 * A violin with four bowed-string contacts and a neck grasp.
 *
 * The violin lies on its back with the neck along +X and string1 on its -Z
 * edge. The bow is made separately with AutoMovieArchetypeInstrument.createViolinBow.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createViolin(
  params: AutoMovieArchetypeViolin.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeViolin.Affordance, AutoMovieArchetypeViolin.Dimension> {
  return InstrumentBuild.create<AutoMovieArchetypeViolin.Affordance>(
    "violin",
    "violin",
    params,
    seed,
    StringedConstruction.violin,
  );
}

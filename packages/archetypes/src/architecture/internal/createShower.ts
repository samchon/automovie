import type { AutoMovieArchetypeShower } from "../AutoMovieArchetypeShower";
import type { AutoMovieArchetype } from "../../core/index";
import { FixtureDraw } from "../FixtureDraw";
import { SANITARY_BANDS } from "../constants/SANITARY_BANDS";
import { SanitaryConstruction } from "../SanitaryConstruction";
import type { AutoMovieArchetypeSanitary } from "../AutoMovieArchetypeSanitary";

/**
 * A front-entry transfer shower with a threshold, floor, wall seat and opposite
 * valve.
 *
 * The threshold, tray and seat retain their original support and the valve
 * retains its location on the opposite wall. The fixture is centred on X, with
 * its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createShower(
  params: AutoMovieArchetypeShower.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeShower.Affordance, AutoMovieArchetypeShower.Dimension> {
  return FixtureDraw.installed<
    AutoMovieArchetypeShower.Affordance,
    AutoMovieArchetypeSanitary.Dimension
  >(
    "sanitary",
    "transfer shower",
    FixtureDraw.sanitary,
    SANITARY_BANDS.shower,
    SANITARY_BANDS,
    params,
    seed,
    SanitaryConstruction.shower,
  );
}

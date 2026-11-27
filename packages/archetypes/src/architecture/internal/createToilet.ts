import type { AutoMovieArchetypeToilet } from "../AutoMovieArchetypeToilet";
import type { AutoMovieArchetype } from "../../core/index";
import { FixtureDraw } from "../FixtureDraw";
import { SANITARY_BANDS } from "../constants/SANITARY_BANDS";
import { SanitaryConstruction } from "../SanitaryConstruction";
import type { AutoMovieArchetypeSanitary } from "../AutoMovieArchetypeSanitary";

/**
 * A wall-backed toilet with a forward-facing seat and a lowering lid.
 *
 * The open lid moves on its existing hinge to the seat. The seat offer keeps
 * the recorded front edge at the drawn height. The fixture is centred on X,
 * with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createToilet(
  params: AutoMovieArchetypeToilet.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeToilet.Affordance, AutoMovieArchetypeToilet.Dimension> {
  return FixtureDraw.installed<
    AutoMovieArchetypeToilet.Affordance,
    AutoMovieArchetypeSanitary.Dimension
  >(
    "sanitary",
    "toilet",
    FixtureDraw.sanitary,
    SANITARY_BANDS.toilet,
    SANITARY_BANDS,
    params,
    seed,
    SanitaryConstruction.toilet,
  );
}

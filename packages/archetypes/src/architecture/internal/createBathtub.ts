import type { AutoMovieArchetypeBathtub } from "../AutoMovieArchetypeBathtub";
import type { AutoMovieArchetype } from "../../core/index";
import { FixtureDraw } from "../FixtureDraw";
import { SANITARY_BANDS } from "../SANITARY_BANDS";
import { SanitaryConstruction } from "../SanitaryConstruction";
import type { createSanitary } from "../createSanitary";

/**
 * A wall-backed bathtub with a front rim and a well floor.
 *
 * The well's floor and front rim retain their measured support locations. A
 * separate room control supplies the plumbing action. The fixture is centred on
 * X, with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createBathtub(
  params: AutoMovieArchetypeBathtub.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBathtub.Affordance, AutoMovieArchetypeBathtub.Dimension> {
  return FixtureDraw.installed<
    AutoMovieArchetypeBathtub.Affordance,
    createSanitary.Dimension
  >(
    "sanitary",
    "bath",
    FixtureDraw.sanitary,
    SANITARY_BANDS.bathtub,
    SANITARY_BANDS,
    params,
    seed,
    SanitaryConstruction.bathtub,
  );
}

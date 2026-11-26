import type { AutoMovieArchetypeWashbasin } from "../AutoMovieArchetypeWashbasin";
import type { AutoMovieArchetype } from "../../core/index";
import { FixtureDraw } from "../FixtureDraw";
import { SANITARY_BANDS } from "../SANITARY_BANDS";
import { SanitaryConstruction } from "../SanitaryConstruction";
import type { createSanitary } from "../createSanitary";

/**
 * A wall-backed washbasin with a rim, tap lever and spout contact.
 *
 * The mixer tap and lift retain their shared lever and parented articulation in
 * `SanitaryConstruction.washbasin`. The fixture is centred on X, with its back
 * at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createWashbasin(
  params: AutoMovieArchetypeWashbasin.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWashbasin.Affordance, AutoMovieArchetypeWashbasin.Dimension> {
  return FixtureDraw.installed<
    AutoMovieArchetypeWashbasin.Affordance,
    createSanitary.Dimension
  >(
    "sanitary",
    "washbasin",
    FixtureDraw.sanitary,
    SANITARY_BANDS.washbasin,
    SANITARY_BANDS,
    params,
    seed,
    SanitaryConstruction.washbasin,
  );
}

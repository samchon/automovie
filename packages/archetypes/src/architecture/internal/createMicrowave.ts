import type { AutoMovieArchetypeMicrowave } from "../AutoMovieArchetypeMicrowave";
import type { AutoMovieArchetype } from "../../core/index";
import { APPLIANCE_BANDS } from "../constants/APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";
import { FixtureDraw } from "./FixtureDraw";
import type { AutoMovieArchetypeAppliance } from "../AutoMovieArchetypeAppliance";

/**
 * A countertop microwave with a cavity floor, a top support and a left-hinged
 * door.
 *
 * The cavity floor and cabinet top retain their stack contacts. The door
 * carries no travel because the measured source gives no opening angle. The
 * fixture is centred on X, with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createMicrowave(
  params: AutoMovieArchetypeMicrowave.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeMicrowave.Affordance, AutoMovieArchetypeMicrowave.Dimension> {
  return FixtureDraw.installed<
    AutoMovieArchetypeMicrowave.Affordance,
    AutoMovieArchetypeAppliance.Dimension
  >(
    "appliance",
    "microwave",
    FixtureDraw.appliance,
    APPLIANCE_BANDS.microwave,
    APPLIANCE_BANDS,
    params,
    seed,
    ApplianceConstruction.microwave,
  );
}

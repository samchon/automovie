import type { AutoMovieArchetypeRefrigerator } from "../AutoMovieArchetypeRefrigerator";
import type { AutoMovieArchetype } from "../../core/index";
import { APPLIANCE_BANDS } from "../constants/APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";
import { FixtureDraw } from "./FixtureDraw";
import type { AutoMovieArchetypeAppliance } from "../AutoMovieArchetypeAppliance";

/**
 * A wall-backed fridge-freezer with right-hinged doors, attached handles and
 * four shelf landing surfaces.
 *
 * The hollow cabinet and four shelves remain in
 * `ApplianceConstruction.refrigerator`; each door carries its handle. The
 * fixture is centred on X, with its back at Z = 0 and its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createRefrigerator(
  params: AutoMovieArchetypeRefrigerator.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeRefrigerator.Affordance,
  AutoMovieArchetypeRefrigerator.Dimension
> {
  return FixtureDraw.installed<
    AutoMovieArchetypeRefrigerator.Affordance,
    AutoMovieArchetypeAppliance.Dimension
  >(
    "appliance",
    "fridge-freezer",
    FixtureDraw.appliance,
    APPLIANCE_BANDS.refrigerator,
    APPLIANCE_BANDS,
    params,
    seed,
    ApplianceConstruction.refrigerator,
  );
}

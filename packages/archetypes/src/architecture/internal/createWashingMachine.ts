import type { AutoMovieArchetypeWashingMachine } from "../AutoMovieArchetypeWashingMachine";
import type { AutoMovieArchetype } from "../../core/index";
import { APPLIANCE_BANDS } from "../APPLIANCE_BANDS";
import { ApplianceConstruction } from "../ApplianceConstruction";
import { FixtureDraw } from "../FixtureDraw";
import type { AutoMovieArchetypeAppliance } from "../AutoMovieArchetypeAppliance";

/**
 * A front-loading washing machine with a hinged round door, a physically hollow
 * drum and a worktop. The door opens 160 degrees and carries its handle; the
 * drum keeps its opening, the loading waypoints and the seat a load rests on
 * fixed in the body.
 *
 * The construction retains the washer's round door pieces, left hinge and
 * horizontal worktop. The fixture is centred on X, with its back at Z = 0 and
 * its front towards +Z.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createWashingMachine(
  params: AutoMovieArchetypeWashingMachine.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeWashingMachine.Affordance,
  AutoMovieArchetypeWashingMachine.Dimension
> {
  return FixtureDraw.installed<
    AutoMovieArchetypeWashingMachine.Affordance,
    AutoMovieArchetypeAppliance.Dimension
  >(
    "appliance",
    "washing machine",
    FixtureDraw.appliance,
    APPLIANCE_BANDS.washingMachine,
    APPLIANCE_BANDS,
    params,
    seed,
    ApplianceConstruction.washingMachine,
  );
}

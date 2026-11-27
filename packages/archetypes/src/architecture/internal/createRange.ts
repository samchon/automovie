import type { AutoMovieArchetypeRange } from "../AutoMovieArchetypeRange";
import type { AutoMovieArchetype } from "../../core/index";
import { APPLIANCE_BANDS } from "../constants/APPLIANCE_BANDS";
import { ApplianceConstruction } from "./ApplianceConstruction";
import { FixtureDraw } from "./FixtureDraw";
import type { AutoMovieArchetypeAppliance } from "../AutoMovieArchetypeAppliance";

/*
 * A freestanding range with a cooktop and four pan landing surfaces.
 *
 * The hob and its four load surfaces remain in `ApplianceConstruction.cooker`;
 * the visible oven door and knobs carry no motion contacts. The fixture is
 * centred on X, with its back at Z = 0 and its front towards +Z.
 * Parameter params: The scene identifier and any dimensions to fix inside their
 * bands.
 * Parameter seed: The seed for the draws the author leaves open.
 * Returns: The fixed model with its typed contacts.
 * If a supplied override lies outside the
 * selected profile.
 */
export function createRange(
  params: AutoMovieArchetypeRange.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRange.Affordance, AutoMovieArchetypeRange.Dimension> {
  return FixtureDraw.installed<
    AutoMovieArchetypeRange.Affordance,
    AutoMovieArchetypeAppliance.Dimension
  >(
    "appliance",
    "cooker",
    FixtureDraw.appliance,
    APPLIANCE_BANDS.cooker,
    APPLIANCE_BANDS,
    params,
    seed,
    ApplianceConstruction.cooker,
  );
}

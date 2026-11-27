import type { AutoMovieArchetypeVendingMachine } from "../AutoMovieArchetypeVendingMachine";
import { type AutoMovieArchetype } from "../../core/index";
import { ServiceCabinet } from "./ServiceCabinet";


/*
 * A snack vending machine with the front and right side of its standing cabinet
 * available for actor contacts.
 *
 * The Merchant 4 and Merchant 6 figures choose the cabinet width as a whole
 * model, while mass comes from the measured band. The cabinet rests on the
 * floor at the origin and faces +Z.
 * Parameter params: The scene identifier, measured model and inside-band dimension
 * overrides.
 * Parameter seed: The seed for the draws the author leaves open.
 * Returns: The fixed model with its typed contacts.
 * If a supplied override lies outside the
 * selected profile.
 */
export function createVendingMachine(
  params: AutoMovieArchetypeVendingMachine.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeVendingMachine.Affordance,
  AutoMovieArchetypeVendingMachine.Dimension
> {
  const cabinet: ServiceCabinet.ICabinet<AutoMovieArchetypeVendingMachine.Affordance> =
    ServiceCabinet.begin(
      "vendingMachine",
      "vending machine",
      "#b3202a",
      params,
      seed,
    );
  ServiceCabinet.faces(cabinet);
  return cabinet.builder.build(cabinet.mass);
}

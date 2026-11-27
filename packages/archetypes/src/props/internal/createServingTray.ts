import type { AutoMovieArchetypeServingTray } from "../AutoMovieArchetypeServingTray";
import type { AutoMovieArchetype } from "../../core/index";
import { TrayConstruction } from "./TrayConstruction";


/**
 * A low serving tray with a real floor and side grips at its short ends, a
 * flat-hand hold under its centre and a glass socket on its floor.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createServingTray(
  params: AutoMovieArchetypeServingTray.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeServingTray.Affordance,
  AutoMovieArchetypeServingTray.Dimension
> {
  return TrayConstruction.servingTray(params, seed);
}

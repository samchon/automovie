import type { AutoMovieArchetypeMoldedCrate } from "../AutoMovieArchetypeMoldedCrate";
import type { AutoMovieArchetype } from "../../core/index";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";


/**
 * An open molded crate with a floor suitable for receiving arranged loads.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createMoldedCrate(
  params: AutoMovieArchetypeMoldedCrate.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeMoldedCrate.Affordance,
  AutoMovieArchetypeMoldedCrate.Dimension
> {
  return ScenicContainerConstruction.openCrate(params, seed);
}

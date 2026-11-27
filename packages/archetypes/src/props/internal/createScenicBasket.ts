import { AutoMovieArchetypeScenicBasket } from "../AutoMovieArchetypeScenicBasket";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";


/**
 * A closed coil basket or open fish basket, with a supported placement surface.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createScenicBasket(
  params: AutoMovieArchetypeScenicBasket.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeScenicBasket.Affordance,
  AutoMovieArchetypeScenicBasket.Dimension
> {
  return ScenicContainerConstruction.baskets(
    ArchetypeDraw.choice(
      "scenicContainer",
      "kind",
      params.kind,
      AutoMovieArchetypeScenicBasket.KINDS,
    ),
    params,
    seed,
  );
}

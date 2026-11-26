import { AutoMovieArchetypePlatformBed } from "../AutoMovieArchetypePlatformBed";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import { BedConstruction } from "../BedConstruction";


/**
 * A single or double household bed with a lying surface and opposed side seats.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createPlatformBed(
  params: AutoMovieArchetypePlatformBed.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypePlatformBed.Affordance,
  AutoMovieArchetypePlatformBed.Dimension
> {
  return BedConstruction.platform(
    ArchetypeDraw.choice("bed", "kind", params.kind, AutoMovieArchetypePlatformBed.KINDS),
    params,
    seed,
  );
}

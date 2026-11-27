import { AutoMovieArchetypePlatformBed } from "../AutoMovieArchetypePlatformBed";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import { BedConstruction } from "./BedConstruction";


/*
 * A single or double household bed with a lying surface and opposed side seats.
 * Parameter params: The optional identifier, the admitted settings and any fixed
 * dimensions in the inherited units.
 * Parameter seed: Draws remaining dimensions and any model choice. Omit it for the
 * first model and band midpoints.
 * Returns: The generated model and its named local contacts.
 * For a setting this producer cannot admit.
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

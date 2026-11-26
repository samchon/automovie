import type { AutoMovieArchetypeCanoe } from "../AutoMovieArchetypeCanoe";
import { type AutoMovieArchetype } from "../../core/index";
import { AutoMovieArchetypeBoat } from "../AutoMovieArchetypeBoat";
import { BoatConstruction } from "../BoatConstruction";
import { BoatHull } from "../BoatHull";

/**
 * Tandem canoe.
 *
 * The bow points along +Z at the waterline. Both thwarts face forward for
 * paddlers and the hull is drawn from its selected layup.
 *
 * @param params The scene identity and this hull's accepted dimensions and
 *   catalogue choices.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createCanoe(
  params: AutoMovieArchetypeCanoe.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCanoe.Affordance, AutoMovieArchetypeCanoe.Dimension> {
  return BoatConstruction("canoe", params, seed, outfit);
}



/** Record this hull's fixed seats. */
function outfit(
  builder: Parameters<BoatConstruction.Outfit>[0],
  { d, beam, bottom }: BoatConstruction.IHull,
): void {
  const e: typeof AutoMovieArchetypeBoat.ESTIMATES =
    AutoMovieArchetypeBoat.ESTIMATES;
  const seat: number = bottom + d.seatHeight!;
  BoatHull.thwart(
    builder,
    "thwart0",
    seat,
    AutoMovieArchetypeBoat.CANOE.bow,
    beam * e.seats.canoeBow,
    1,
  );
  BoatHull.thwart(
    builder,
    "thwart1",
    seat,
    -AutoMovieArchetypeBoat.CANOE.stern,
    beam * e.seats.canoeStern,
    1,
  );
}

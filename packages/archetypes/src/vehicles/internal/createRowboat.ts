import type { AutoMovieArchetypeRowboat } from "../AutoMovieArchetypeRowboat";
import { type AutoMovieArchetype } from "../../core/index";
import { AutoMovieArchetypeBoat } from "../AutoMovieArchetypeBoat";
import { BoatConstruction } from "./BoatConstruction";
import { BoatHull } from "./BoatHull";
import { BoatOars } from "./BoatOars";

/*
 * Fixed-seat rowboat.
 *
 * The hull floats at its waterline with its bow along +Z. The rowing thwart
 * faces aft and its paired oars sit in articulated locks.
 * Parameter params: The scene identity and this hull's accepted dimensions and
 * catalogue choices.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createRowboat(
  params: AutoMovieArchetypeRowboat.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRowboat.Affordance, AutoMovieArchetypeRowboat.Dimension> {
  return BoatConstruction("rowboat", params, seed, outfit);
}



/*
 * Record this hull's fixed seats and articulated rowing station.
 */
function outfit(
  builder: Parameters<BoatConstruction.Outfit>[0],
  { d, length, beam, gunwale, stern }: BoatConstruction.IHull,
): void {
  const e: typeof AutoMovieArchetypeBoat.ESTIMATES =
    AutoMovieArchetypeBoat.ESTIMATES;
  const span: number = beam;
  const pivot: number = gunwale + AutoMovieArchetypeBoat.LOCK;
  const seat: number = pivot - BoatOars.HEIGHT * span;
  const aft: number = BoatOars.AFT * span;
  // The rowing station's height comes from the oarlock geometry rather
  // than chair ergonomics. Its rower's joints admit the working seat.
  BoatHull.thwart(
    builder,
    "thwart0",
    seat,
    aft,
    beam * e.seats.rowing,
    -1,
    true,
  );
  BoatHull.thwart(
    builder,
    "thwart1",
    seat,
    aft + AutoMovieArchetypeBoat.ROWBOAT.forward,
    beam * e.seats.forward,
    -1,
  );
  BoatHull.thwart(
    builder,
    "sternSeat",
    seat,
    -length / 2 + AutoMovieArchetypeBoat.ROWBOAT.stern,
    2 * stern,
    1,
  );
  BoatOars.build(builder, d);
}

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { type AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import { HorseBandsData } from "./internal/HorseBandsData";

/*
 * The band of each free dimension of a saddle horse, with the source it was
 * read at; `createHorse.BANDS` is this table. The girth and the mass follow the
 * height (`createHorse.PROFILE.girth`, `AutoMovieArchetypeEquine.mass`), and
 * the seat and the reins are read sizes (`AutoMovieArchetypeEquine.SEATS`,
 * `AutoMovieArchetypeEquine.REINS`), so none of them is a band.
 */
export const HORSE_BANDS: Readonly<
  Record<
    Exclude<AutoMovieArchetypeEquine.Free, "croupClearance">,
    IAutoMovieArchetypeBand
  >
> = {
  withersHeight: AutoMovieArchetypeBand.metres(
    1.58,
    1.8,
    `${HorseBandsData.JENSEN}: height at withers 172 cm, range 158 to 180`,
  ),
  stirrupDrop: AutoMovieArchetypeBand.metres(0.575, 0.775, HorseBandsData.LEATHERS, true),
  stirrupWidth: AutoMovieArchetypeBand.metres(
    0.11,
    0.13,
    "stirrup tread widths of 110 to 130 mm by boot size, a Kingdom Equestrian chart seen only in search results",
    true,
  ),
  breechingDrop: AutoMovieArchetypeBand.metres(
    2 * AutoMovieArchetypeUnits.INCH,
    4 * AutoMovieArchetypeUnits.INCH,
    'D. Hammill, Ask a Teamster: Positioning of the Breeching, Small Farmers Journal (https://smallfarmersjournal.com/ask-a-teamster-positioning-of-the-breeching/): "A relatively flat area can be felt from a couple to a few inches below the POB"; 2 to 4 in is this model\'s reading of "a couple to a few inches", not the author\'s figure',
    true,
  ),
  tempo: AutoMovieArchetypeBand.of(
    "",
    -1,
    1,
    "one standard deviation of stride time either side of the mean, Robilliard, Pfau and Wilson 2007, Tables 2 and 3 (https://journals.biologists.com/jeb/article/210/2/187/17107/Gait-characterisation-and-classification-in-horses)",
  ),
};

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeBoat } from "../AutoMovieArchetypeBoat";
import { BoatBandsData } from "./internal/BoatBandsData";

/*
 * The band of each free dimension of a boat, by kind, with the source it was
 * read at; `AutoMovieArchetypeBoat.BANDS` is this table. A rowboat's and a
 * canoe's hull and mass are their read model's (`BOAT_MODELS`), not bands.
 */
export const BOAT_BANDS: Readonly<
  Record<
    AutoMovieArchetypeBoat.Kind,
    Readonly<
      Partial<Record<AutoMovieArchetypeBoat.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  rowboat: {
    draft: AutoMovieArchetypeBand.metres(
      5 * AutoMovieArchetypeUnits.INCH,
      7 * AutoMovieArchetypeUnits.INCH,
      `${BoatBandsData.ROWBOAT}: the Thames skiff's and the Whitehall skiff's drafts, borrowed by the Glen-L Whitehall, whose page gives none and whose draft no law gives from its other figures (searched: the Glen-L page's specifications)`,
      true,
    ),
  },
  canoe: {
    seatHeight: AutoMovieArchetypeBand.metres(
      7 * AutoMovieArchetypeUnits.INCH,
      9 * AutoMovieArchetypeUnits.INCH,
      "Clipper Canoes, seats 7 to 9 in off the hull bottom (https://www.clippercanoes.com/pages/canoe-design)",
    ),
  },
  launch: {
    length: AutoMovieArchetypeBand.metres(
      360 * AutoMovieArchetypeUnits.INCH,
      360 * AutoMovieArchetypeUnits.INCH,
      BoatBandsData.LAUNCH,
    ),
    beam: AutoMovieArchetypeBand.metres(
      105 * AutoMovieArchetypeUnits.INCH,
      105 * AutoMovieArchetypeUnits.INCH,
      BoatBandsData.LAUNCH,
    ),
    depth: AutoMovieArchetypeBand.metres(
      42 * AutoMovieArchetypeUnits.INCH,
      42 * AutoMovieArchetypeUnits.INCH,
      BoatBandsData.LAUNCH,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      38 * 112 * AutoMovieArchetypeUnits.POUND,
      38 * 112 * AutoMovieArchetypeUnits.POUND,
      `${BoatBandsData.LAUNCH}; a hundredweight is 112 lb`,
    ),
  },
};

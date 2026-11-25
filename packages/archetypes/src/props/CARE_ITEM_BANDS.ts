import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../core";
import type { createCareItem } from "./createCareItem";

/** A provisional mass band in kilograms. */
const kg = (minimum: number, maximum: number): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.of(
    "kg",
    minimum,
    maximum,
    AutoMovieArchetypeBand.TYPICAL_MASS,
    true,
  );

/** A facial tissue sheet, from distributor listings. */
const TISSUE: string =
  "Kleenex facial tissue sheet, 21.3 x 20.3 cm, Kimberly-Clark Professional distributor listings seen only in search results";

/** Pocket combs, from a maker's pages seen in search results. */
const COMB: string =
  "Kent Brushes pocket combs, 112 to 154 mm long and 25 to 27 mm wide, product pages seen only in search results";

/** Toothbrush sizes, from a listing and two patents. */
const BRUSH: string =
  "Curaprox CS 5460, 18 cm (listing seen only in search results); Canadian patent 3058910, about 194 to 197 mm overall; US patent 6353959, handle 1.375 in round";

/**
 * A lipstick case read whole; Ellemental's case gives its height but not its
 * width, so it is not built.
 */
const LIPSTICK: string =
  "Quadpack magnetic lipstick case, 21 mm across and 74 mm high (https://americas.quadpack.com/?p=16738)";

/**
 * The band of each free dimension of `createCareItem`, by kind, with the
 * sources they are read at: kept apart from the producer so each file stays
 * within its size.
 */
export const CARE_ITEM_BANDS: typeof createCareItem.BANDS = {
  tissue: {
    length: AutoMovieArchetypeBand.metres(0.198, 0.21, TISSUE, true),
    width: AutoMovieArchetypeBand.metres(0.203, 0.213, TISSUE, true),
    thickness: AutoMovieArchetypeBand.metres(
      0.0005,
      0.0005,
      "a soft two-ply sheet, not read at a source",
      true,
    ),
    mass: kg(0.001, 0.002),
  },
  comb: {
    length: AutoMovieArchetypeBand.metres(0.112, 0.154, COMB, true),
    width: AutoMovieArchetypeBand.metres(0.025, 0.027, COMB, true),
    thickness: AutoMovieArchetypeBand.metres(
      0.003,
      0.004,
      "comb spine thickness, not read at a source",
      true,
    ),
    mass: kg(0.01, 0.02),
  },
  toothbrush: {
    length: AutoMovieArchetypeBand.metres(0.18, 0.197, BRUSH, true),
    width: AutoMovieArchetypeBand.metres(0.011, 0.011, BRUSH, true),
    mass: kg(0.015, 0.025),
  },
  tube: {
    mass: kg(0.02, 0.3),
  },
  razor: {
    width: AutoMovieArchetypeBand.metres(
      0.012,
      0.016,
      "the handle's diameter; the razors' pages read do not give it",
      true,
    ),
  },
  lipstick: {
    length: AutoMovieArchetypeBand.metres(0.074, 0.074, LIPSTICK),
    width: AutoMovieArchetypeBand.metres(0.021, 0.021, LIPSTICK),
    mass: kg(0.01, 0.03),
  },
};

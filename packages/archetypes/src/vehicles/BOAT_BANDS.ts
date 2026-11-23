import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createBoat } from "./createBoat";

/** Fixed-seat rowboats read at their designers' pages. */
const ROWBOAT: string =
  "the Selway-Fisher 14 ft Thames skiff (14 ft x 4 ft 2 in, depth 1 ft 6 in, 85 lb; https://selway-fisher.com/Rowskiffs.htm), the Duckworks 15 ft 6 in Whitehall skiff (beam 4 ft 5.5 in, depth 1 ft 6.5 in, draft 7 in, 95 lb; https://duckworks.com/15-6-whitehall-skiff) and the Glen-L 17 ft Whitehall (16 ft 11 in x 4 ft 6 in, depth amidships 1 ft 10 in, 350 lb; https://www.glen-l.com/17-Whitehall-traditional-rowing-craft/products/190/)";

/** A Navy pulling boat for a landing party. */
const LAUNCH: string =
  "the Peake boat, Woolwich Dockyard: 30 ft extreme, 8 ft 9 in beam, 3 ft 6 in deep, five thwarts 28 in apart and 7 in below the gunwale, ten oars double-banked, 38 cwt (A. A. Ackerman, 'Navy Boats', USNI Proceedings, June 1890; https://www.usni.org/magazines/proceedings/1890/june/navy-boats)";

/**
 * The band of each free dimension of a boat, by kind, with the source it was
 * read at; `createBoat.BANDS` is this table. A rowboat's and a canoe's hull and
 * mass are their read model's (`BOAT_MODELS`), not bands.
 */
export const BOAT_BANDS: Readonly<
  Record<
    createBoat.Kind,
    Readonly<Partial<Record<createBoat.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  rowboat: {
    draft: AutoMovieArchetypeBand.metres(
      5 * AutoMovieArchetypeUnits.INCH,
      7 * AutoMovieArchetypeUnits.INCH,
      `${ROWBOAT}: the Thames skiff's and the Whitehall skiff's drafts, borrowed by the Glen-L Whitehall, whose page gives none and whose draft no law gives from its other figures (searched: the Glen-L page's specifications)`,
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
      LAUNCH,
    ),
    beam: AutoMovieArchetypeBand.metres(
      105 * AutoMovieArchetypeUnits.INCH,
      105 * AutoMovieArchetypeUnits.INCH,
      LAUNCH,
    ),
    depth: AutoMovieArchetypeBand.metres(
      42 * AutoMovieArchetypeUnits.INCH,
      42 * AutoMovieArchetypeUnits.INCH,
      LAUNCH,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      38 * 112 * AutoMovieArchetypeUnits.POUND,
      38 * 112 * AutoMovieArchetypeUnits.POUND,
      `${LAUNCH}; a hundredweight is 112 lb`,
    ),
  },
};

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeSanitary } from "../AutoMovieArchetypeSanitary";
import { AutoMovieArchetypeTap } from "../AutoMovieArchetypeTap";

/** The accessibility standard, read. */
const ADA: string = "2010 ADA Standards (https://www.access-board.gov/ada/)";

/** The basin read. */
const KINGSTON: string =
  "Kohler Kingston K-2005 wall-mount basin specification sheet: 21-1/4 x 18-1/8 in (540 x 460 mm), basin 16 x 10 in (406 x 254 mm), basin depth 10-1/8 in (257 mm) (https://techcomm.kohler.com/techcomm/pdf/K-2005_spec_US-CA_Kohler_en.pdf)";

/** The toilet read. */
const HIGHLINE: string =
  "Kohler Highline K-3999 specification sheet: bowl front 29-3/4 in (756 mm) from the finished wall, tank 3/4 in (19 mm) off it, 8-5/8 in (219 mm) deep and 18-1/8 in (460 mm) wide with its top 31-1/4 in (794 mm) high, seat holes 16-5/8 in (422 mm) behind the bowl's front (https://techcomm.kohler.com/techcomm/pdf/K-3999_spec_US-CA_Kohler_en.pdf)";

/** The baths read and searched. */
const BATH: string =
  "Kohler Bellwether K-837 specification sheet: 60 x 30-1/4 in, 14 in apron, basin bottom 48-3/4 x 19-5/16 in (1238 x 491 mm), water depth 9 in (229 mm), 310 lb (140.6 kg) (https://techcomm.kohler.com/techcomm/pdf/K-837_spec_US-CA_Kohler_en.pdf)";

/** The steel bath, from a search only. */
const PRINCETON: string =
  "American Standard Princeton recess bath, 60 x 30 x 14 in and 50 kg, as search results summarise its sheets; not read";

/** The bands of a basin's mixer: the basin mixer `createTap` cites. */
const TAP: Readonly<
  Partial<Record<AutoMovieArchetypeSanitary.Dimension, IAutoMovieArchetypeBand>>
> = {
  tapHeight: AutoMovieArchetypeTap.BANDS.height,
  tapReach: AutoMovieArchetypeTap.BANDS.reach,
  tapOutlet: AutoMovieArchetypeTap.BANDS.outlet,
};

/** The band of each free dimension of {@link createSanitary}, by kind. */
export const SANITARY_BANDS: Readonly<
  Record<
    AutoMovieArchetypeSanitary.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeSanitary.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  washbasin: {
    rim: AutoMovieArchetypeBand.metres(
      0.865,
      0.865,
      `${ADA} 606.3, the front of the rim or counter at most 34 in (865 mm) above the floor; the model takes the limit`,
    ),
    width: AutoMovieArchetypeBand.metres(0.54, 0.54, KINGSTON),
    depth: AutoMovieArchetypeBand.metres(0.46, 0.46, KINGSTON),
    bowlWidth: AutoMovieArchetypeBand.metres(0.406, 0.406, KINGSTON),
    bowlDepth: AutoMovieArchetypeBand.metres(0.254, 0.254, KINGSTON),
    basinDepth: AutoMovieArchetypeBand.metres(0.257, 0.257, KINGSTON),
    ...TAP,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      12,
      20,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  toilet: {
    seat: AutoMovieArchetypeBand.metres(
      0.43,
      0.485,
      `${ADA} 604.4, the seat 17 to 19 in (430 to 485 mm) above the floor`,
    ),
    length: AutoMovieArchetypeBand.metres(0.756, 0.756, HIGHLINE),
    seatDepth: AutoMovieArchetypeBand.metres(0.422, 0.422, HIGHLINE),
    width: AutoMovieArchetypeBand.metres(
      0.432,
      0.432,
      "American Standard Cadet 3 elongated, nominal 724 x 432 x 768 mm, as a search result gives it; not read",
      true,
    ),
    tankWidth: AutoMovieArchetypeBand.metres(0.46, 0.46, HIGHLINE),
    tankDepth: AutoMovieArchetypeBand.metres(0.219, 0.219, HIGHLINE),
    tankTop: AutoMovieArchetypeBand.metres(0.794, 0.794, HIGHLINE),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      30,
      45,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  bathtub: {
    rim: AutoMovieArchetypeBand.metres(
      14 * AutoMovieArchetypeUnits.INCH,
      14 * AutoMovieArchetypeUnits.INCH,
      `${BATH}; ${PRINCETON}`,
    ),
    length: AutoMovieArchetypeBand.metres(
      60 * AutoMovieArchetypeUnits.INCH,
      60 * AutoMovieArchetypeUnits.INCH,
      `${BATH}; ${PRINCETON}`,
    ),
    width: AutoMovieArchetypeBand.metres(
      30 * AutoMovieArchetypeUnits.INCH,
      (30 + 1 / 4) * AutoMovieArchetypeUnits.INCH,
      `${PRINCETON} (30 in), to ${BATH} (30-1/4 in)`,
      true,
    ),
    wellLength: AutoMovieArchetypeBand.metres(1.238, 1.238, BATH),
    wellWidth: AutoMovieArchetypeBand.metres(0.491, 0.491, BATH),
    waterDepth: AutoMovieArchetypeBand.metres(0.229, 0.229, BATH),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      50,
      140.6,
      `${PRINCETON} (enamelled steel), to ${BATH} (cast iron)`,
      true,
    ),
  },
  shower: {
    interior: AutoMovieArchetypeBand.metres(
      0.915,
      0.915,
      `${ADA} 608.2.1, a transfer shower 36 x 36 in (915 x 915 mm) inside`,
    ),
    wallHeight: AutoMovieArchetypeBand.metres(
      78 * AutoMovieArchetypeUnits.INCH,
      (80 + 7 / 16) * AutoMovieArchetypeUnits.INCH,
      "one-piece 36 x 36 in transfer stalls, 78 in (Aqua Bath) to 80-7/16 in (Frank Webb) high, as search results give them; not read",
      true,
    ),
    threshold: AutoMovieArchetypeBand.metres(
      0.013,
      0.013,
      `${ADA} 608.7, a transfer shower's threshold at most 1/2 in (13 mm) high; the model takes the limit`,
    ),
    seat: AutoMovieArchetypeBand.metres(
      0.43,
      0.485,
      `${ADA} 610.3, a shower seat's top 17 to 19 in (430 to 485 mm) above the floor`,
    ),
    seatDepth: AutoMovieArchetypeBand.metres(
      0.38,
      0.405,
      `${ADA} 610.3.1, the seat's front edge 15 to 16 in (380 to 405 mm) from the seat wall`,
    ),
    control: AutoMovieArchetypeBand.metres(
      0.965,
      1.22,
      `${ADA} 608.5.1, a transfer shower's controls 38 to 48 in (965 to 1220 mm) above the shower floor`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      60,
      120,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
};

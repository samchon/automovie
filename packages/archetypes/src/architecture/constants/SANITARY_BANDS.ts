import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeSanitary } from "../AutoMovieArchetypeSanitary";
import "../AutoMovieArchetypeTap";
import { SanitaryBandsData } from "./internal/SanitaryBandsData";

/*
 * The band of each free dimension of createSanitary, by kind.
 */
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
      `${SanitaryBandsData.ADA} 606.3, the front of the rim or counter at most 34 in (865 mm) above the floor; the model takes the limit`,
    ),
    width: AutoMovieArchetypeBand.metres(0.54, 0.54, SanitaryBandsData.KINGSTON),
    depth: AutoMovieArchetypeBand.metres(0.46, 0.46, SanitaryBandsData.KINGSTON),
    bowlWidth: AutoMovieArchetypeBand.metres(0.406, 0.406, SanitaryBandsData.KINGSTON),
    bowlDepth: AutoMovieArchetypeBand.metres(0.254, 0.254, SanitaryBandsData.KINGSTON),
    basinDepth: AutoMovieArchetypeBand.metres(0.257, 0.257, SanitaryBandsData.KINGSTON),
    ...SanitaryBandsData.TAP,
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
      `${SanitaryBandsData.ADA} 604.4, the seat 17 to 19 in (430 to 485 mm) above the floor`,
    ),
    length: AutoMovieArchetypeBand.metres(0.756, 0.756, SanitaryBandsData.HIGHLINE),
    seatDepth: AutoMovieArchetypeBand.metres(0.422, 0.422, SanitaryBandsData.HIGHLINE),
    width: AutoMovieArchetypeBand.metres(
      0.432,
      0.432,
      "American Standard Cadet 3 elongated, nominal 724 x 432 x 768 mm, as a search result gives it; not read",
      true,
    ),
    tankWidth: AutoMovieArchetypeBand.metres(0.46, 0.46, SanitaryBandsData.HIGHLINE),
    tankDepth: AutoMovieArchetypeBand.metres(0.219, 0.219, SanitaryBandsData.HIGHLINE),
    tankTop: AutoMovieArchetypeBand.metres(0.794, 0.794, SanitaryBandsData.HIGHLINE),
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
      `${SanitaryBandsData.BATH}; ${SanitaryBandsData.PRINCETON}`,
    ),
    length: AutoMovieArchetypeBand.metres(
      60 * AutoMovieArchetypeUnits.INCH,
      60 * AutoMovieArchetypeUnits.INCH,
      `${SanitaryBandsData.BATH}; ${SanitaryBandsData.PRINCETON}`,
    ),
    width: AutoMovieArchetypeBand.metres(
      30 * AutoMovieArchetypeUnits.INCH,
      (30 + 1 / 4) * AutoMovieArchetypeUnits.INCH,
      `${SanitaryBandsData.PRINCETON} (30 in), to ${SanitaryBandsData.BATH} (30-1/4 in)`,
      true,
    ),
    wellLength: AutoMovieArchetypeBand.metres(1.238, 1.238, SanitaryBandsData.BATH),
    wellWidth: AutoMovieArchetypeBand.metres(0.491, 0.491, SanitaryBandsData.BATH),
    waterDepth: AutoMovieArchetypeBand.metres(0.229, 0.229, SanitaryBandsData.BATH),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      50,
      140.6,
      `${SanitaryBandsData.PRINCETON} (enamelled steel), to ${SanitaryBandsData.BATH} (cast iron)`,
      true,
    ),
  },
  shower: {
    interior: AutoMovieArchetypeBand.metres(
      0.915,
      0.915,
      `${SanitaryBandsData.ADA} 608.2.1, a transfer shower 36 x 36 in (915 x 915 mm) inside`,
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
      `${SanitaryBandsData.ADA} 608.7, a transfer shower's threshold at most 1/2 in (13 mm) high; the model takes the limit`,
    ),
    seat: AutoMovieArchetypeBand.metres(
      0.43,
      0.485,
      `${SanitaryBandsData.ADA} 610.3, a shower seat's top 17 to 19 in (430 to 485 mm) above the floor`,
    ),
    seatDepth: AutoMovieArchetypeBand.metres(
      0.38,
      0.405,
      `${SanitaryBandsData.ADA} 610.3.1, the seat's front edge 15 to 16 in (380 to 405 mm) from the seat wall`,
    ),
    control: AutoMovieArchetypeBand.metres(
      0.965,
      1.22,
      `${SanitaryBandsData.ADA} 608.5.1, a transfer shower's controls 38 to 48 in (965 to 1220 mm) above the shower floor`,
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

import { ArchetypeBand, type IArchetypeBand } from "../core";
import { createTap } from "./createTap";
import type { createSanitary } from "./createSanitary";

/** The accessibility standard, read. */
const ADA: string = "2010 ADA Standards (https://www.access-board.gov/ada/)";

/** The basin read. */
const KINGSTON: string =
  "Kohler Kingston K-2005 wall-mount basin specification sheet: 21-1/4 x 18-1/8 in (540 x 460 mm), basin 16 x 10 in (406 x 254 mm) (https://techcomm.kohler.com/techcomm/pdf/K-2005_spec_US-CA_Kohler_en.pdf)";

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
const TAP: Readonly<Partial<Record<createSanitary.Dimension, IArchetypeBand>>> =
  {
    tapHeight: createTap.BANDS.height,
    tapReach: createTap.BANDS.reach,
    tapOutlet: createTap.BANDS.outlet,
  };

/**
 * The band of each free dimension of {@link createSanitary}, by kind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds; each band names its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension per kind, keyed by the producer's closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Kept beside the producer, as `DOOR_BANDS` is, so the producer stays one readable construction; it re-exports as `createSanitary.BANDS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Where a code gives only a limit and no maker's figure was read, the model takes the limit and says so; masses no sheet gives are provisional.
 */
export const SANITARY_BANDS: Readonly<
  Record<
    createSanitary.Kind,
    Readonly<Partial<Record<createSanitary.Dimension, IArchetypeBand>>>
  >
> = {
  washbasin: {
    rim: ArchetypeBand.metres(
      0.865,
      0.865,
      `${ADA} 606.3, the front of the rim or counter at most 34 in (865 mm) above the floor; the model takes the limit`,
    ),
    width: ArchetypeBand.metres(0.54, 0.54, KINGSTON),
    depth: ArchetypeBand.metres(0.46, 0.46, KINGSTON),
    bowlWidth: ArchetypeBand.metres(0.406, 0.406, KINGSTON),
    bowlDepth: ArchetypeBand.metres(0.254, 0.254, KINGSTON),
    ...TAP,
    mass: ArchetypeBand.of("kg", 12, 20, ArchetypeBand.TYPICAL_MASS, true),
  },
  toilet: {
    seat: ArchetypeBand.metres(
      0.43,
      0.485,
      `${ADA} 604.4, the seat 17 to 19 in (430 to 485 mm) above the floor`,
    ),
    length: ArchetypeBand.metres(0.756, 0.756, HIGHLINE),
    seatDepth: ArchetypeBand.metres(0.422, 0.422, HIGHLINE),
    width: ArchetypeBand.metres(
      0.432,
      0.432,
      "American Standard Cadet 3 elongated, nominal 724 x 432 x 768 mm, as a search result gives it; not read",
      true,
    ),
    tankWidth: ArchetypeBand.metres(0.46, 0.46, HIGHLINE),
    tankDepth: ArchetypeBand.metres(0.219, 0.219, HIGHLINE),
    tankTop: ArchetypeBand.metres(0.794, 0.794, HIGHLINE),
    mass: ArchetypeBand.of("kg", 30, 45, ArchetypeBand.TYPICAL_MASS, true),
  },
  bathtub: {
    rim: ArchetypeBand.metres(0.356, 0.356, `${BATH}; ${PRINCETON}`),
    length: ArchetypeBand.metres(1.524, 1.524, `${BATH}; ${PRINCETON}`),
    width: ArchetypeBand.metres(
      0.762,
      0.768,
      `${PRINCETON} (30 in), to ${BATH} (30-1/4 in)`,
      true,
    ),
    wellLength: ArchetypeBand.metres(1.238, 1.238, BATH),
    wellWidth: ArchetypeBand.metres(0.491, 0.491, BATH),
    waterDepth: ArchetypeBand.metres(0.229, 0.229, BATH),
    mass: ArchetypeBand.of(
      "kg",
      50,
      140.6,
      `${PRINCETON} (enamelled steel), to ${BATH} (cast iron)`,
      true,
    ),
  },
  shower: {
    interior: ArchetypeBand.metres(
      0.915,
      0.915,
      `${ADA} 608.2.1, a transfer shower 36 x 36 in (915 x 915 mm) inside`,
    ),
    wallHeight: ArchetypeBand.metres(
      1.981,
      2.043,
      "one-piece 36 x 36 in transfer stalls, 78 in (Aqua Bath) to 80-7/16 in (Frank Webb) high, as search results give them; not read",
      true,
    ),
    threshold: ArchetypeBand.metres(
      0.013,
      0.013,
      `${ADA} 608.7, a transfer shower's threshold at most 1/2 in (13 mm) high; the model takes the limit`,
    ),
    seat: ArchetypeBand.metres(
      0.43,
      0.485,
      `${ADA} 610.3, a shower seat's top 17 to 19 in (430 to 485 mm) above the floor`,
    ),
    seatDepth: ArchetypeBand.metres(
      0.38,
      0.405,
      `${ADA} 610.3.1, the seat's front edge 15 to 16 in (380 to 405 mm) from the seat wall`,
    ),
    control: ArchetypeBand.metres(
      0.965,
      1.22,
      `${ADA} 608.5.1, a transfer shower's controls 38 to 48 in (965 to 1220 mm) above the shower floor`,
    ),
    mass: ArchetypeBand.of("kg", 60, 120, ArchetypeBand.TYPICAL_MASS, true),
  },
};

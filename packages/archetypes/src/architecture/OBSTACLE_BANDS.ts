import { ArchetypeBand, ArchetypeUnits, type IArchetypeBand } from "../core";
import type { createObstacle } from "./createObstacle";

/** The crosstie read. */
const TIE: string =
  "University of Kentucky FOR-108, Producing and Inspecting Railroad Crossties: most commonly 7 x 9 in, some 6 x 8 and 7 x 8 in; 8 ft 6 in the most common length, 8 ft standard, 9 ft sometimes required (https://publications.mgcafe.uky.edu/sites/publications.ca.uky.edu/files/FOR108.pdf)";

/** The sandbag read. */
const SANDBAG: string =
  "USACE Northwestern Division, Sandbagging Techniques (2004): bags about 14 x 24 in filled half to two-thirds; laid, one bag long is about 1 ft, three wide about 2-1/2 ft, three high about 1 ft (https://extension.usu.edu/post-wildfire/files/USACE-Sandbag-Pamphlet.pdf)";

/** The concrete barrier read. */
const JERSEY: string =
  "FHWA-RD-89-036, Figure 1 and Introduction: the New Jersey portable concrete safety shaped barrier 32 in high with a 24 in base and a 6 in top, a 3 in curb and a 10 in lower face; 3 to 30 ft long at 450 to 550 lb per foot (https://www.fhwa.dot.gov/publications/research/safety/89036/89036.pdf)";

/** The crowd barriers, from a search only. */
const CROWD: string =
  "steel crowd barriers of 43 in by 7.5 ft with a 1.5 in frame tube and 4 in bar spacing, 23.5 to 34 lb, as search results give BroadFence and Crowd Control Warehouse listings; not read";

/** The stanchions, from a search only. */
const LAVI: string =
  "Lavi Industries stanchion posts 40 in high, 2-3/4 in post, 14-1/2 in base, and 6 ft velour ropes 1-1/2 in thick, as search results give reseller listings; not read";

/**
 * The band of each free dimension of {@link createObstacle}, by kind.
 */
export const OBSTACLE_BANDS: Readonly<
  Record<
    createObstacle.Kind,
    Readonly<Partial<Record<createObstacle.Dimension, IArchetypeBand>>>
  >
> = {
  crosstie: {
    mass: ArchetypeBand.of(
      "kg",
      70,
      110,
      `${ArchetypeBand.TYPICAL_MASS}; its sizes by ${TIE}`,
      true,
    ),
  },
  sandbag: {
    length: ArchetypeBand.metres(
      ArchetypeUnits.FOOT,
      ArchetypeUnits.FOOT,
      SANDBAG,
    ),
    height: ArchetypeBand.metres(
      ArchetypeUnits.FOOT / 3,
      ArchetypeUnits.FOOT / 3,
      `${SANDBAG}: a third of a foot`,
    ),
    width: ArchetypeBand.metres(
      (2.5 * ArchetypeUnits.FOOT) / 3,
      (2.5 * ArchetypeUnits.FOOT) / 3,
      `${SANDBAG}: a third of 2-1/2 ft`,
    ),
    mass: ArchetypeBand.of(
      "kg",
      35 * ArchetypeUnits.POUND,
      50 * ArchetypeUnits.POUND,
      "filled sandbags of 35 to 50 lb, as search results give USACE district brochures; not read",
      true,
    ),
  },
  jerseyBarrier: {
    length: ArchetypeBand.metres(
      3 * ArchetypeUnits.FOOT,
      30 * ArchetypeUnits.FOOT,
      JERSEY,
    ),
    height: ArchetypeBand.metres(
      32 * ArchetypeUnits.INCH,
      32 * ArchetypeUnits.INCH,
      JERSEY,
    ),
    width: ArchetypeBand.metres(
      24 * ArchetypeUnits.INCH,
      24 * ArchetypeUnits.INCH,
      JERSEY,
    ),
    top: ArchetypeBand.metres(
      6 * ArchetypeUnits.INCH,
      6 * ArchetypeUnits.INCH,
      JERSEY,
    ),
    curb: ArchetypeBand.metres(
      3 * ArchetypeUnits.INCH,
      3 * ArchetypeUnits.INCH,
      JERSEY,
    ),
    lowerFace: ArchetypeBand.metres(
      10 * ArchetypeUnits.INCH,
      10 * ArchetypeUnits.INCH,
      JERSEY,
    ),
    massPerMetre: ArchetypeBand.of(
      "kg",
      (450 * ArchetypeUnits.POUND) / ArchetypeUnits.FOOT,
      (550 * ArchetypeUnits.POUND) / ArchetypeUnits.FOOT,
      `${JERSEY}, per metre`,
    ),
  },
  crowdBarrier: {
    length: ArchetypeBand.metres(
      7.5 * ArchetypeUnits.FOOT,
      7.5 * ArchetypeUnits.FOOT,
      CROWD,
      true,
    ),
    height: ArchetypeBand.metres(
      43 * ArchetypeUnits.INCH,
      43 * ArchetypeUnits.INCH,
      CROWD,
      true,
    ),
    tube: ArchetypeBand.metres(
      1.5 * ArchetypeUnits.INCH,
      1.5 * ArchetypeUnits.INCH,
      CROWD,
      true,
    ),
    spacing: ArchetypeBand.metres(
      4 * ArchetypeUnits.INCH,
      4 * ArchetypeUnits.INCH,
      CROWD,
      true,
    ),
    mass: ArchetypeBand.of(
      "kg",
      23.5 * ArchetypeUnits.POUND,
      34 * ArchetypeUnits.POUND,
      CROWD,
      true,
    ),
  },
  ropeAndPosts: {
    length: ArchetypeBand.metres(
      6 * ArchetypeUnits.FOOT,
      6 * ArchetypeUnits.FOOT,
      LAVI,
      true,
    ),
    height: ArchetypeBand.metres(
      40 * ArchetypeUnits.INCH,
      40 * ArchetypeUnits.INCH,
      LAVI,
      true,
    ),
    post: ArchetypeBand.metres(
      (2 + 3 / 4) * ArchetypeUnits.INCH,
      (2 + 3 / 4) * ArchetypeUnits.INCH,
      LAVI,
      true,
    ),
    base: ArchetypeBand.metres(
      (14 + 1 / 2) * ArchetypeUnits.INCH,
      (14 + 1 / 2) * ArchetypeUnits.INCH,
      LAVI,
      true,
    ),
    ropeDiameter: ArchetypeBand.metres(
      1.5 * ArchetypeUnits.INCH,
      1.5 * ArchetypeUnits.INCH,
      LAVI,
      true,
    ),
    mass: ArchetypeBand.of("kg", 15, 25, ArchetypeBand.TYPICAL_MASS, true),
  },
};

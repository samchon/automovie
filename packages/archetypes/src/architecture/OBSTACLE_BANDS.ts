import { ArchetypeBand, type IArchetypeBand } from "../core";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds; each band names its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension per kind, keyed by the producer's closed unions; a concrete barrier's mass is per metre of its length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Kept beside the producer, as `DOOR_BANDS` is, so the producer stays one readable construction; it re-exports as `createObstacle.BANDS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bands read only from search results are provisional as a whole.
 */
export const OBSTACLE_BANDS: Readonly<
  Record<
    createObstacle.Kind,
    Readonly<Partial<Record<createObstacle.Dimension, IArchetypeBand>>>
  >
> = {
  crosstie: {
    length: ArchetypeBand.metres(2.438, 2.743, TIE),
    height: ArchetypeBand.metres(
      0.152,
      0.178,
      `${TIE}: its depth as laid, 6 or 7 in`,
    ),
    width: ArchetypeBand.metres(0.203, 0.229, `${TIE}: its face, 8 or 9 in`),
    mass: ArchetypeBand.of("kg", 70, 110, ArchetypeBand.TYPICAL_MASS, true),
  },
  sandbag: {
    length: ArchetypeBand.metres(0.305, 0.305, SANDBAG),
    height: ArchetypeBand.metres(
      0.102,
      0.102,
      `${SANDBAG}: a third of a foot`,
    ),
    width: ArchetypeBand.metres(
      0.254,
      0.254,
      `${SANDBAG}: a third of 2-1/2 ft`,
    ),
    mass: ArchetypeBand.of(
      "kg",
      15.9,
      22.7,
      "filled sandbags of 35 to 50 lb, as search results give USACE district brochures; not read",
      true,
    ),
  },
  jerseyBarrier: {
    length: ArchetypeBand.metres(0.914, 9.144, JERSEY),
    height: ArchetypeBand.metres(0.813, 0.813, JERSEY),
    width: ArchetypeBand.metres(0.61, 0.61, JERSEY),
    top: ArchetypeBand.metres(0.152, 0.152, JERSEY),
    curb: ArchetypeBand.metres(0.076, 0.076, JERSEY),
    lowerFace: ArchetypeBand.metres(0.254, 0.254, JERSEY),
    massPerMetre: ArchetypeBand.of(
      "kg",
      669.7,
      818.5,
      `${JERSEY}, per metre`,
    ),
  },
  crowdBarrier: {
    length: ArchetypeBand.metres(2.286, 2.286, CROWD, true),
    height: ArchetypeBand.metres(1.092, 1.092, CROWD, true),
    tube: ArchetypeBand.metres(0.038, 0.038, CROWD, true),
    spacing: ArchetypeBand.metres(0.102, 0.102, CROWD, true),
    mass: ArchetypeBand.of("kg", 10.7, 15.4, CROWD, true),
  },
  ropeAndPosts: {
    length: ArchetypeBand.metres(1.829, 1.829, LAVI, true),
    height: ArchetypeBand.metres(1.016, 1.016, LAVI, true),
    post: ArchetypeBand.metres(0.07, 0.07, LAVI, true),
    base: ArchetypeBand.metres(0.368, 0.368, LAVI, true),
    ropeDiameter: ArchetypeBand.metres(0.038, 0.038, LAVI, true),
    mass: ArchetypeBand.of("kg", 15, 25, ArchetypeBand.TYPICAL_MASS, true),
  },
};

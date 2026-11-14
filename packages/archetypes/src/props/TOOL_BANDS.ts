import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createTool } from "./createTool";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), inside the 30 to 50 mm power grip range of CCOHS (https://www.ccohs.ca/oshanswers/ergonomics/handtools/tooldesign.html); applied to this tool's handle, whose own diameter no maker states";

/** A claw hammer, from a maker's page seen in search results. */
const HAMMER: string =
  "Estwing E3-16C claw hammer, 13 in long with a 16 oz head, product page seen only in search results";

/** Hand saws, from makers' listings seen in search results. */
const SAW: string =
  "Stanley 20 in and Bahco 22 in hand saws, blades 500 to 550 mm, listings seen only in search results";

/** A screwdriver read at its maker's catalogue. */
const SCREWDRIVER: string =
  "Klein Tools 603-4, overall 8.25 in, shank 4 in, 4 oz (https://www.kleintools.com/catalog/fixed-blade-screwdrivers/2-phillips-screwdriver-4-inch-round-shank)";

/** Spoons read at a maker's pages. */
const SPOON: string =
  "IKEA DRAGON dessert spoon 16 cm and spoon 17 cm (https://www.ikea.com/fi/en/p/dragon-dessert-spoon-stainless-steel-50090381, https://www.ikea.com/ie/en/p/dragon-spoon-stainless-steel-30091763/); the teaspoon's 13 cm seen only in search results";

/** A table fork, read. */
const FORK: string =
  "IKEA DRAGON fork, stainless steel, 19 cm, sold in fours at 0.18 kg the pack (https://www.ikea.com/de/en/p/dragon-fork-stainless-steel-00515527/)";

/** A table knife, read. */
const KNIFE: string =
  "IKEA DRAGON knife, stainless steel, 21 cm, sold in fours at 0.32 kg the pack (https://www.ikea.com/gb/en/p/dragon-knife-stainless-steel-40515530/)";

/** Two ladles, read. */
const LADLE: string =
  "Rösle hook ladle, 320 mm, bowl 9 cm, 0.218 kg (https://www.roesle.com/en/hook-ladle-with-pouring-rim-oe-9-cm-35-in); IKEA FINMAT ladle, 31 cm (https://www.ikea.com/gb/en/p/finmat-soup-ladle-stainless-steel-50555196)";

/** The precision handle band applied to a handle no maker sizes. */
const PRECISION: string =
  "the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a handle no maker read sizes";

/**
 * The band of each free dimension of {@link createTool}, by kind, with the sources they are read at: kept apart from the producer so each file stays within its size.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds and why it is its own file.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension per kind, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read only as `createTool.BANDS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band names its source; one not read at its primary source is provisional.
 */
export const TOOL_BANDS: Readonly<
  Record<
    createTool.Kind,
    Readonly<Partial<Record<createTool.Dimension, IArchetypeBand>>>
  >
> = {
    hammer: {
      length: ArchetypeBand.metres(0.33, 0.33, HAMMER, true),
      gripDiameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: ArchetypeBand.of(
        "kg",
        0.6,
        0.75,
        `${HAMMER}: the 448 g head with a handle, the whole not read at a source`,
        true,
      ),
    },
    saw: {
      length: ArchetypeBand.metres(0.61, 0.62, SAW, true),
      blade: ArchetypeBand.metres(0.5, 0.55, SAW, true),
      gripDiameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: ArchetypeBand.of("kg", 0.35, 0.5, ArchetypeBand.TYPICAL_MASS, true),
    },
    screwdriver: {
      length: ArchetypeBand.metres(0.21, 0.21, SCREWDRIVER),
      blade: ArchetypeBand.metres(0.102, 0.102, SCREWDRIVER),
      gripDiameter: ArchetypeBand.metres(0.03, 0.04, POWER, true),
      mass: ArchetypeBand.of("kg", 0.113, 0.113, SCREWDRIVER),
    },
    spoon: {
      length: ArchetypeBand.metres(0.13, 0.17, SPOON, true),
      gripDiameter: ArchetypeBand.metres(
        0.006,
        0.013,
        "the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a spoon handle",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.03,
        0.05,
        ArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    fork: {
      length: ArchetypeBand.metres(0.19, 0.19, FORK),
      gripDiameter: ArchetypeBand.metres(
        0.006,
        0.013,
        "the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a fork handle",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.045,
        0.045,
        `${FORK}: a quarter of the pack`,
      ),
    },
    tableKnife: {
      length: ArchetypeBand.metres(0.21, 0.21, KNIFE),
      gripDiameter: ArchetypeBand.metres(
        0.006,
        0.013,
        "the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a table knife's handle",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.08,
        0.08,
        `${KNIFE}: a quarter of the pack`,
      ),
    },
    ladle: {
      length: ArchetypeBand.metres(0.31, 0.32, LADLE),
      bowl: ArchetypeBand.metres(0.09, 0.09, LADLE),
      gripDiameter: ArchetypeBand.metres(0.006, 0.013, PRECISION, true),
      mass: ArchetypeBand.of("kg", 0.218, 0.218, LADLE),
    },
};

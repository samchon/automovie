import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { PRIMING_WIRE } from "./PRIMING_WIRE";
import type { AutoMovieArchetypeTool } from "../AutoMovieArchetypeTool";

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

/**
 * A ladle, read whole; IKEA's FINMAT page gives a length but no bowl or weight,
 * so it is not built.
 */
const LADLE: string =
  "Rösle hook ladle, 320 mm, bowl 9 cm, 0.218 kg (https://www.roesle.com/en/hook-ladle-with-pouring-rim-oe-9-cm-35-in)";

/**
 * A field gun's priming wire, read; its weight is read only for the garrison
 * wire.
 */
const PRIMING: string =
  '1862 Ordnance Manual, p. 134 (https://archive.org/details/ordnancemanualfo00unitrich): "Priming-wire; iron wire 0.175 inch diameter, formed with a ring 2 inches diameter at the head, and pointed; length of stem, for siege and garrison guns, 14 inches; length for field-guns, 8 inches. Weight 0.08 lb. for garrison guns."';

/** The precision handle band applied to a handle no maker sizes. */
const PRECISION: string =
  "the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a handle no maker read sizes";

/**
 * The band of each free dimension of {@link createTool}, by kind, with the
 * sources they are read at: kept apart from the producer so each file stays
 * within its size. One cited band per dimension per kind, in metres and
 * kilograms, read only as `createTool.BANDS`; every band names its source, and
 * one not read at its primary source is provisional.
 */
export const TOOL_BANDS: Readonly<
  Record<
    AutoMovieArchetypeTool.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeTool.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  hammer: {
    length: AutoMovieArchetypeBand.metres(
      13 * AutoMovieArchetypeUnits.INCH,
      13 * AutoMovieArchetypeUnits.INCH,
      HAMMER,
      true,
    ),
    gripDiameter: AutoMovieArchetypeBand.metres(0.03, 0.04, POWER, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.6,
      0.75,
      `${HAMMER}: the 448 g head with a handle, the whole not read at a source`,
      true,
    ),
  },
  saw: {
    length: AutoMovieArchetypeBand.metres(0.61, 0.62, SAW, true),
    blade: AutoMovieArchetypeBand.metres(0.5, 0.55, SAW, true),
    gripDiameter: AutoMovieArchetypeBand.metres(0.03, 0.04, POWER, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.35,
      0.5,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  screwdriver: {
    length: AutoMovieArchetypeBand.metres(
      8.25 * AutoMovieArchetypeUnits.INCH,
      8.25 * AutoMovieArchetypeUnits.INCH,
      SCREWDRIVER,
    ),
    blade: AutoMovieArchetypeBand.metres(
      4 * AutoMovieArchetypeUnits.INCH,
      4 * AutoMovieArchetypeUnits.INCH,
      SCREWDRIVER,
    ),
    gripDiameter: AutoMovieArchetypeBand.metres(0.03, 0.04, POWER, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      4 * AutoMovieArchetypeUnits.OUNCE,
      4 * AutoMovieArchetypeUnits.OUNCE,
      SCREWDRIVER,
    ),
  },
  spoon: {
    length: AutoMovieArchetypeBand.metres(0.13, 0.17, SPOON, true),
    gripDiameter: AutoMovieArchetypeBand.metres(
      0.006,
      0.013,
      "the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a spoon handle",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.03,
      0.05,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  fork: {
    length: AutoMovieArchetypeBand.metres(0.19, 0.19, FORK),
    gripDiameter: AutoMovieArchetypeBand.metres(
      0.006,
      0.013,
      "the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf), applied to a fork handle",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.045,
      0.045,
      `${FORK}: a quarter of the pack`,
    ),
  },
  ladle: {
    length: AutoMovieArchetypeBand.metres(0.32, 0.32, LADLE),
    bowl: AutoMovieArchetypeBand.metres(0.09, 0.09, LADLE),
    gripDiameter: AutoMovieArchetypeBand.metres(0.006, 0.013, PRECISION, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.218, 0.218, LADLE),
  },
  knife: {
    gripDiameter: AutoMovieArchetypeBand.metres(0.006, 0.013, PRECISION, true),
  },
  primingWire: {
    length: AutoMovieArchetypeBand.metres(
      PRIMING_WIRE.ring + PRIMING_WIRE.field,
      PRIMING_WIRE.ring + PRIMING_WIRE.field,
      `${PRIMING}: the 2 in ring and the 8 in field stem`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      PRIMING_WIRE.mass,
      PRIMING_WIRE.mass,
      `${PRIMING}: the garrison wire's 0.08 lb scaled by the length of wire in the field wire's ring and 8 in stem over the garrison wire's ring and 14 in stem, a derivation`,
    ),
  },
};

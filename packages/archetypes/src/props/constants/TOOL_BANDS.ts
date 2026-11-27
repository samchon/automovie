import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { PRIMING_WIRE } from "./PRIMING_WIRE";
import type { AutoMovieArchetypeTool } from "../AutoMovieArchetypeTool";
import { ToolBandsData } from "./internal/ToolBandsData";

/*
 * The band of each free dimension of createTool, by kind, with the
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
      ToolBandsData.HAMMER,
      true,
    ),
    gripDiameter: AutoMovieArchetypeBand.metres(0.03, 0.04, ToolBandsData.POWER, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.6,
      0.75,
      `${ToolBandsData.HAMMER}: the 448 g head with a handle, the whole not read at a source`,
      true,
    ),
  },
  saw: {
    length: AutoMovieArchetypeBand.metres(0.61, 0.62, ToolBandsData.SAW, true),
    blade: AutoMovieArchetypeBand.metres(0.5, 0.55, ToolBandsData.SAW, true),
    gripDiameter: AutoMovieArchetypeBand.metres(0.03, 0.04, ToolBandsData.POWER, true),
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
      ToolBandsData.SCREWDRIVER,
    ),
    blade: AutoMovieArchetypeBand.metres(
      4 * AutoMovieArchetypeUnits.INCH,
      4 * AutoMovieArchetypeUnits.INCH,
      ToolBandsData.SCREWDRIVER,
    ),
    gripDiameter: AutoMovieArchetypeBand.metres(0.03, 0.04, ToolBandsData.POWER, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      4 * AutoMovieArchetypeUnits.OUNCE,
      4 * AutoMovieArchetypeUnits.OUNCE,
      ToolBandsData.SCREWDRIVER,
    ),
  },
  spoon: {
    length: AutoMovieArchetypeBand.metres(0.13, 0.17, ToolBandsData.SPOON, true),
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
    length: AutoMovieArchetypeBand.metres(0.19, 0.19, ToolBandsData.FORK),
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
      `${ToolBandsData.FORK}: a quarter of the pack`,
    ),
  },
  ladle: {
    length: AutoMovieArchetypeBand.metres(0.32, 0.32, ToolBandsData.LADLE),
    bowl: AutoMovieArchetypeBand.metres(0.09, 0.09, ToolBandsData.LADLE),
    gripDiameter: AutoMovieArchetypeBand.metres(0.006, 0.013, ToolBandsData.PRECISION, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.218, 0.218, ToolBandsData.LADLE),
  },
  knife: {
    gripDiameter: AutoMovieArchetypeBand.metres(0.006, 0.013, ToolBandsData.PRECISION, true),
  },
  primingWire: {
    length: AutoMovieArchetypeBand.metres(
      PRIMING_WIRE.ring + PRIMING_WIRE.field,
      PRIMING_WIRE.ring + PRIMING_WIRE.field,
      `${ToolBandsData.PRIMING}: the 2 in ring and the 8 in field stem`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      PRIMING_WIRE.mass,
      PRIMING_WIRE.mass,
      `${ToolBandsData.PRIMING}: the garrison wire's 0.08 lb scaled by the length of wire in the field wire's ring and 8 in stem over the garrison wire's ring and 14 in stem, a derivation`,
    ),
  },
};

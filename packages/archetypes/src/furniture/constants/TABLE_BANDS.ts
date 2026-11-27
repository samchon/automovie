import { AutoMovieArchetypeBand, AutoMovieArchetypeUnits } from "../../core";
import type { AutoMovieArchetypeTable } from "../AutoMovieArchetypeTable";
import * as TableBandsData from "./internal/TableBandsData";

/*
 * The band of each free dimension of `createTable`, by kind, with the sources
 * they are read at: kept apart from the producer so each file stays within its
 * size.
 */
export const TABLE_BANDS: typeof AutoMovieArchetypeTable.BANDS = {
  dining: {
    height: AutoMovieArchetypeBand.metres(
      0.71,
      30 * AutoMovieArchetypeUnits.INCH,
      `2010 ADA Standards 902.3, dining surface at least 28 in (710 mm) high (https://www.access-board.gov/ada/), up to the 30 in table of ${TableBandsData.NKBA}`,
    ),
    length: AutoMovieArchetypeBand.metres(
      0.8,
      1.65,
      `${TableBandsData.ADM}: dining table 800 mm deep and 800 to 1650 mm long`,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.8,
      0.8,
      `${TableBandsData.ADM}: dining table 800 mm deep`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      20,
      45,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  desk: {
    height: AutoMovieArchetypeBand.metres(
      0.72,
      0.76,
      `${TableBandsData.EN527}: fixed height desk, 740 mm plus or minus 20`,
    ),
    length: AutoMovieArchetypeBand.metres(
      46 * AutoMovieArchetypeUnits.INCH,
      60 * AutoMovieArchetypeUnits.INCH,
      "ANSI/HFES 100-2007, work surface at least 46 in wide and 60 in recommended, as quoted by the University of Washington furniture guide (https://facilities.uw.edu/files/media/uwf-ds-eh-and-s-office-ergonomics-furniture-design.pdf)",
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.6,
      0.8,
      `${TableBandsData.EN527}: desk top at least 800 mm deep, 600 mm acceptable in some situations`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      20,
      45,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  counter: {
    height: AutoMovieArchetypeBand.metres(
      0.914,
      0.914,
      `${TableBandsData.NKBA}: 36 in (914 mm) high counters`,
    ),
    length: AutoMovieArchetypeBand.metres(
      1.2,
      2.4,
      "counter run length, not read at a source",
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.508,
      0.635,
      `${TableBandsData.NKBA}: 508 to 635 mm deep counter`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      90,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  coffee: {
    height: AutoMovieArchetypeBand.metres(
      0.4,
      0.45,
      "coffee table height, not read at a source",
      true,
    ),
    length: AutoMovieArchetypeBand.metres(
      1.05,
      1.05,
      `${TableBandsData.ADM}: coffee table 500 x 1050 mm`,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.5,
      0.5,
      `${TableBandsData.ADM}: coffee table 500 x 1050 mm`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      8,
      20,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  bar: {
    height: AutoMovieArchetypeBand.metres(1.067, 1.067, TableBandsData.SEATING),
    length: AutoMovieArchetypeBand.metres(
      1.2,
      2.4,
      "counter run length, not read at a source",
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.813,
      0.94,
      `${TableBandsData.NKBA}: a 508 to 635 mm deep counter under the top, the top reaching the 305 mm knee space further over it; ${TableBandsData.SEATING}`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      50,
      110,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  serviceCounter: {
    height: AutoMovieArchetypeBand.metres(0.91, 0.91, TableBandsData.SERVICE),
    depth: AutoMovieArchetypeBand.metres(0.76, 0.76, TableBandsData.SERVICE),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      90,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  workbench: {
    height: AutoMovieArchetypeBand.metres(
      90 * AutoMovieArchetypeUnits.CENTIMETRE,
      94 * AutoMovieArchetypeUnits.CENTIMETRE,
      `${TableBandsData.RIMFORSA}: its adjustable height`,
    ),
    length: AutoMovieArchetypeBand.metres(
      120 * AutoMovieArchetypeUnits.CENTIMETRE,
      120 * AutoMovieArchetypeUnits.CENTIMETRE,
      TableBandsData.RIMFORSA,
    ),
    depth: AutoMovieArchetypeBand.metres(
      63.5 * AutoMovieArchetypeUnits.CENTIMETRE,
      63.5 * AutoMovieArchetypeUnits.CENTIMETRE,
      TableBandsData.RIMFORSA,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      64,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}; its three packages weigh 64.5 kg`,
      true,
    ),
  },
  pupilDesk: {
    length: AutoMovieArchetypeBand.metres(
      24 * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      TableBandsData.SILHOUETTE,
    ),
    depth: AutoMovieArchetypeBand.metres(
      18 * AutoMovieArchetypeUnits.INCH,
      18 * AutoMovieArchetypeUnits.INCH,
      TableBandsData.SILHOUETTE,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      33 * AutoMovieArchetypeUnits.POUND,
      33 * AutoMovieArchetypeUnits.POUND,
      TableBandsData.SILHOUETTE,
    ),
  },
  altar: {
    height: AutoMovieArchetypeBand.metres(
      40 * AutoMovieArchetypeUnits.INCH,
      40 * AutoMovieArchetypeUnits.INCH,
      TableBandsData.WOERNER,
    ),
    length: AutoMovieArchetypeBand.metres(
      72 * AutoMovieArchetypeUnits.INCH,
      72 * AutoMovieArchetypeUnits.INCH,
      TableBandsData.WOERNER,
    ),
    depth: AutoMovieArchetypeBand.metres(
      30 * AutoMovieArchetypeUnits.INCH,
      30 * AutoMovieArchetypeUnits.INCH,
      TableBandsData.WOERNER,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      275 * AutoMovieArchetypeUnits.POUND,
      450 * AutoMovieArchetypeUnits.POUND,
      "the Woerner catalog gives no mass; Cokesbury's listings of Woerner's 417 (60 x 28 x 39 in, 275 lb) and 656 (72 x 40 x 39 in, 450 lb) altars, seen only in search results, bound it",
      true,
    ),
  },
};

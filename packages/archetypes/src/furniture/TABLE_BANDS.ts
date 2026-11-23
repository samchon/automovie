import { AutoMovieArchetypeBand, AutoMovieArchetypeUnits } from "../core";
import type { createTable } from "./createTable";

/** The UK furniture schedule. */
const ADM: string =
  "Approved Document M Volume 1, Appendix D furniture schedule (https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/540330/BR_PDF_AD_M1_2015_with_2016_amendments_V3.pdf)";

/** The kitchen planning guidelines. */
const NKBA: string =
  "NKBA Kitchen Planning Guidelines with Access Standards (https://kb.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf)";

/** The kitchen guideline read for a raised counter's seating. */
const SEATING: string =
  "NKBA Kitchen Planning Guidelines with Access Standards, Guideline 9 Seating Clearance: 42 in (1067 mm) high counters with a 24 in wide by 12 in (305 mm) deep knee space for each seated diner (https://kb.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf)";

/** The service counter read. */
const SERVICE: string =
  "Delfield Shelleysteel SCS mobile cashier's counter sheet: 30.00 in (76 cm) deep, 36.00 in (91 cm) high, 30, 36 or 50 in long (https://cdn.restaurantsupply.com/pdf/9/6/4/9644b43a-1127-42c0-87fa-1935fe9071fa.pdf); 2010 ADA Standards 904.4, a service counter's accessible portion at most 36 in (915 mm) high (https://www.access-board.gov/ada/chapter/ch09/)";

/** The workbench read. */
const RIMFORSA: string =
  "IKEA RIMFORSA work bench 903.992.84: length 120 cm, width 63.5 cm, height 92 cm (min 90, max 94) (https://www.ikea.com/gb/en/p/rimforsa-work-bench-stainless-steel-bamboo-90399284)";

/** The office desk standard. */
const EN527: string =
  "EN 527-1:2011 Table 1 (https://cdn.standards.iteh.ai/samples/26022/6cc3729a004c4ce9a231c68a38e8620c/SIST-EN-527-1-2012.pdf)";

/** The pupil desk read. */
const SILHOUETTE: string =
  "Smith System Silhouette student desk #01601 sheet: top 18 x 24 in, 5/8 in thick, height 19 to 31 in in 1 in steps, 33 lb, the optional book box apart (https://smithsystem.com/wp-content/uploads/2017/10/ss_01601_2018.pdf)";

/** The altar read. */
const WOERNER: string =
  "Woerner Industries Church and Funeral Furniture Catalog 2023, p. 09: 5061 Altar, 72 in wide, 30 in deep, 40 in high (https://store.occatholic.com/Images/Woerner_Catalog.pdf)";

/**
 * The band of each free dimension of `createTable`, by kind, with the sources
 * they are read at: kept apart from the producer so each file stays within its
 * size.
 */
export const TABLE_BANDS: typeof createTable.BANDS = {
  dining: {
    height: AutoMovieArchetypeBand.metres(
      0.71,
      30 * AutoMovieArchetypeUnits.INCH,
      `2010 ADA Standards 902.3, dining surface at least 28 in (710 mm) high (https://www.access-board.gov/ada/), up to the 30 in table of ${NKBA}`,
    ),
    length: AutoMovieArchetypeBand.metres(
      0.8,
      1.65,
      `${ADM}: dining table 800 mm deep and 800 to 1650 mm long`,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.8,
      0.8,
      `${ADM}: dining table 800 mm deep`,
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
      `${EN527}: fixed height desk, 740 mm plus or minus 20`,
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
      `${EN527}: desk top at least 800 mm deep, 600 mm acceptable in some situations`,
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
      `${NKBA}: 36 in (914 mm) high counters`,
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
      `${NKBA}: 508 to 635 mm deep counter`,
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
      `${ADM}: coffee table 500 x 1050 mm`,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.5,
      0.5,
      `${ADM}: coffee table 500 x 1050 mm`,
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
    height: AutoMovieArchetypeBand.metres(1.067, 1.067, SEATING),
    length: AutoMovieArchetypeBand.metres(
      1.2,
      2.4,
      "counter run length, not read at a source",
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.813,
      0.94,
      `${NKBA}: a 508 to 635 mm deep counter under the top, the top reaching the 305 mm knee space further over it; ${SEATING}`,
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
    height: AutoMovieArchetypeBand.metres(0.91, 0.91, SERVICE),
    depth: AutoMovieArchetypeBand.metres(0.76, 0.76, SERVICE),
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
      `${RIMFORSA}: its adjustable height`,
    ),
    length: AutoMovieArchetypeBand.metres(
      120 * AutoMovieArchetypeUnits.CENTIMETRE,
      120 * AutoMovieArchetypeUnits.CENTIMETRE,
      RIMFORSA,
    ),
    depth: AutoMovieArchetypeBand.metres(
      63.5 * AutoMovieArchetypeUnits.CENTIMETRE,
      63.5 * AutoMovieArchetypeUnits.CENTIMETRE,
      RIMFORSA,
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
      SILHOUETTE,
    ),
    depth: AutoMovieArchetypeBand.metres(
      18 * AutoMovieArchetypeUnits.INCH,
      18 * AutoMovieArchetypeUnits.INCH,
      SILHOUETTE,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      33 * AutoMovieArchetypeUnits.POUND,
      33 * AutoMovieArchetypeUnits.POUND,
      SILHOUETTE,
    ),
  },
  altar: {
    height: AutoMovieArchetypeBand.metres(
      40 * AutoMovieArchetypeUnits.INCH,
      40 * AutoMovieArchetypeUnits.INCH,
      WOERNER,
    ),
    length: AutoMovieArchetypeBand.metres(
      72 * AutoMovieArchetypeUnits.INCH,
      72 * AutoMovieArchetypeUnits.INCH,
      WOERNER,
    ),
    depth: AutoMovieArchetypeBand.metres(
      30 * AutoMovieArchetypeUnits.INCH,
      30 * AutoMovieArchetypeUnits.INCH,
      WOERNER,
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

import { ADA_RANGES } from "../architecture/ADA_RANGES";
import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { AutoMovieArchetypeStorage } from "./AutoMovieArchetypeStorage";

/** The UK furniture schedule. */
const ADM: string =
  "Approved Document M Volume 1, Appendix D furniture schedule (https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/540330/BR_PDF_AD_M1_2015_with_2016_amendments_V3.pdf)";

/** The filing cabinet, from a search only. */
const HON: string =
  "HON 510 Series four-drawer letter file, 52 x 15 x 25 in, full-suspension drawers of 23 1/2 filing inches, as search results give HON's and retailers' listings; not read";

/** The locker read. */
const LYON: string =
  "Lyon standard steel lockers, single tier 12 to 18 in wide, 12 to 21 in deep and 60 or 72 in high, legs adding 6 in, a recessed handle and one shelf (https://www.directools.com/documents/all/LYON_5042_Specification_Sheet.pdf)";

/** The bookcase read. */
const BILLY: string =
  "IKEA BILLY bookcase, 80 x 28 x 202 cm, one fixed and four adjustable shelves, 30 kg a shelf (https://www.ikea.com/de/en/p/billy-bookcase-white-00263850)";

/**
 * The band of each free dimension of {@link createStorage}, by kind, but those
 * its models fix.
 */
export const STORAGE_BANDS: Readonly<
  Record<
    AutoMovieArchetypeStorage.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeStorage.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  wardrobe: {
    width: AutoMovieArchetypeBand.metres(
      1.2,
      1.2,
      `${ADM}: double wardrobe 600 x 1200 mm`,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.6,
      0.6,
      `${ADM}: double wardrobe 600 x 1200 mm`,
    ),
    height: AutoMovieArchetypeBand.metres(
      1.8,
      2.1,
      "wardrobe height, not read at a source",
      true,
    ),
    pullHeight: AutoMovieArchetypeBand.metres(
      ADA_RANGES.hardware.low,
      ADA_RANGES.hardware.high,
      `${ADA_RANGES.hardware.source}; a cabinet's pulls share door hardware's range within ${ADA_RANGES.reach.source}`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      50,
      90,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  chest: {
    width: AutoMovieArchetypeBand.metres(
      0.75,
      0.75,
      `${ADM}: chest of drawers 450 x 750 mm`,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.45,
      0.45,
      `${ADM}: chest of drawers 450 x 750 mm`,
    ),
    height: AutoMovieArchetypeBand.metres(
      0.75,
      1.1,
      "chest of drawers height, not read at a source",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      25,
      50,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  filingCabinet: {
    width: AutoMovieArchetypeBand.metres(
      15 * AutoMovieArchetypeUnits.INCH,
      15 * AutoMovieArchetypeUnits.INCH,
      HON,
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      25 * AutoMovieArchetypeUnits.INCH,
      25 * AutoMovieArchetypeUnits.INCH,
      HON,
      true,
    ),
    height: AutoMovieArchetypeBand.metres(
      52 * AutoMovieArchetypeUnits.INCH,
      52 * AutoMovieArchetypeUnits.INCH,
      HON,
      true,
    ),
    travel: AutoMovieArchetypeBand.metres(
      (23 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      (23 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      `${HON}: a full-suspension drawer drawn its whole filing length`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      60,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  locker: {
    height: AutoMovieArchetypeBand.metres(
      72 * AutoMovieArchetypeUnits.INCH,
      72 * AutoMovieArchetypeUnits.INCH,
      `${LYON}: the 72 in opening`,
    ),
    legs: AutoMovieArchetypeBand.metres(
      6 * AutoMovieArchetypeUnits.INCH,
      6 * AutoMovieArchetypeUnits.INCH,
      `${LYON}: 6 in legs`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      25,
      45,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  bookcase: {
    width: AutoMovieArchetypeBand.metres(0.8, 0.8, BILLY),
    depth: AutoMovieArchetypeBand.metres(0.28, 0.28, BILLY),
    height: AutoMovieArchetypeBand.metres(2.02, 2.02, BILLY),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      30,
      38,
      `${BILLY}: 36.85 kg packed, the assembled bookcase a little less`,
      true,
    ),
  },
};

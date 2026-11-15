import { ADA_RANGES } from "../architecture/ADA_RANGES";
import { ArchetypeBand, ArchetypeUnits, type IArchetypeBand } from "../core";
import type { createStorage } from "./createStorage";

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
 * The band of each free dimension of {@link createStorage}, by kind, but those its models fix.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds; each band names its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension per kind, keyed by the producer's closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Kept beside the producer so the producer stays one readable construction; it re-exports as `createStorage.BANDS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A band read only in search results is provisional as a whole.
 */
export const STORAGE_BANDS: Readonly<
  Record<
    createStorage.Kind,
    Readonly<Partial<Record<createStorage.Dimension, IArchetypeBand>>>
  >
> = {
  wardrobe: {
    width: ArchetypeBand.metres(
      1.2,
      1.2,
      `${ADM}: double wardrobe 600 x 1200 mm`,
    ),
    depth: ArchetypeBand.metres(
      0.6,
      0.6,
      `${ADM}: double wardrobe 600 x 1200 mm`,
    ),
    height: ArchetypeBand.metres(
      1.8,
      2.1,
      "wardrobe height, not read at a source",
      true,
    ),
    pullHeight: ArchetypeBand.metres(
      ADA_RANGES.hardware.low,
      ADA_RANGES.hardware.high,
      `${ADA_RANGES.hardware.source}; a cabinet's pulls share door hardware's range within ${ADA_RANGES.reach.source}`,
    ),
    mass: ArchetypeBand.of("kg", 50, 90, ArchetypeBand.TYPICAL_MASS, true),
  },
  chest: {
    width: ArchetypeBand.metres(
      0.75,
      0.75,
      `${ADM}: chest of drawers 450 x 750 mm`,
    ),
    depth: ArchetypeBand.metres(
      0.45,
      0.45,
      `${ADM}: chest of drawers 450 x 750 mm`,
    ),
    height: ArchetypeBand.metres(
      0.75,
      1.1,
      "chest of drawers height, not read at a source",
      true,
    ),
    mass: ArchetypeBand.of("kg", 25, 50, ArchetypeBand.TYPICAL_MASS, true),
  },
  filingCabinet: {
    width: ArchetypeBand.metres(
      15 * ArchetypeUnits.INCH,
      15 * ArchetypeUnits.INCH,
      HON,
      true,
    ),
    depth: ArchetypeBand.metres(
      25 * ArchetypeUnits.INCH,
      25 * ArchetypeUnits.INCH,
      HON,
      true,
    ),
    height: ArchetypeBand.metres(
      52 * ArchetypeUnits.INCH,
      52 * ArchetypeUnits.INCH,
      HON,
      true,
    ),
    travel: ArchetypeBand.metres(
      (23 + 1 / 2) * ArchetypeUnits.INCH,
      (23 + 1 / 2) * ArchetypeUnits.INCH,
      `${HON}: a full-suspension drawer drawn its whole filing length`,
      true,
    ),
    mass: ArchetypeBand.of("kg", 40, 60, ArchetypeBand.TYPICAL_MASS, true),
  },
  locker: {
    height: ArchetypeBand.metres(
      72 * ArchetypeUnits.INCH,
      72 * ArchetypeUnits.INCH,
      `${LYON}: the 72 in opening`,
    ),
    legs: ArchetypeBand.metres(
      6 * ArchetypeUnits.INCH,
      6 * ArchetypeUnits.INCH,
      `${LYON}: 6 in legs`,
    ),
    mass: ArchetypeBand.of("kg", 25, 45, ArchetypeBand.TYPICAL_MASS, true),
  },
  bookcase: {
    width: ArchetypeBand.metres(0.8, 0.8, BILLY),
    depth: ArchetypeBand.metres(0.28, 0.28, BILLY),
    height: ArchetypeBand.metres(2.02, 2.02, BILLY),
    mass: ArchetypeBand.of(
      "kg",
      30,
      38,
      `${BILLY}: 36.85 kg packed, the assembled bookcase a little less`,
      true,
    ),
  },
};

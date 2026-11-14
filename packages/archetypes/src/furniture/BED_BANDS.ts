import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createBed } from "./createBed";

/** UK bed sizes. */
const SIZES: string =
  "National Bed Federation, UK bed sizes: single 90 x 190 cm, double 135 x 190 cm (https://bedadvice.co.uk/bed-talk/bed-sizes-uk-bed-and-mattress-size-guide/)";

/** The bed heights a hospital bed study found safest to rise from. */
const HEIGHT: string =
  "hospital bed height study, mid-range bed heights of 39 to 63 cm (DOI 10.1177/10711813251369356, https://stacks.cdc.gov/view/cdc/259417/cdc_259417_DS1.pdf)";

/** Mattress thickness, for which no source was found. */
const MATTRESS: string = "mattress thickness, not read at a source";

/** The hospital bed read. */
const GOBED: string =
  "Stryker GoBed II specification sheet: 94.25 in (239.4 cm) long, 40 in (101.6 cm) wide with siderails up, litter top 14.5 to 29 in (36.8 to 73.7 cm) high, patient surface 36 x 84 in (91 x 213 cm), backrest 0 to 60 degrees (https://www.stryker.com/content/dam/stryker/acute-care/products/gobedii/resources/GoBedII_SpecSheet_Mkt%20Lit-116.pdf)";

/** The crib regulation read. */
const CRIB: string =
  "16 CFR 1508.3 and 1508.4: interior 28 +/- 5/8 in by 52 3/8 +/- 5/8 in, the rail at its highest at least 26 in above the mattress support at its lowest, components at most 2 3/8 in apart (https://chanrobles.com/usa/uslaws/cfr/title16/16-2.0.1.3.58.php); the mattress at most 6 in thick (https://www.cpsc.gov/FAQ/Full-Size-Baby-Cribs)";

/** The hospital mattress, from a search only. */
const ISOFLEX: string =
  "Stryker IsoFlex LAL support surface, 6 in (15 cm) thick, as a search result gives Stryker's sheet; not read";

/** The siderail height, from a search only. */
const SIDERAIL: string =
  "a hospital bed's siderail top at least 220 mm above the mattress, after IEC 60601-2-52 as a bed supplier's risk-assessment guideline gives it (Algeos), a search result only; not read";

/** The crib's height, from a search only. */
const CRIB_TOP: string =
  "full-size cribs 33.5 in (Graco Teddi) to 36.25 in (DaVinci Ryder, front rail to floor) high, as search results give the makers' listings; not read";

/** The bunk bed read. */
const MYDAL: string =
  "IKEA MYDAL bunk bed frame, 90 x 200 cm: 206 cm long, 97 cm wide, 157 cm high, mattress at most 19 cm thick, 91 cm between the beds, 20 cm free under it (https://www.ikea.com/se/en/p/mydal-bunk-bed-frame-pine-00102452)";

/**
 * The band of each free dimension of {@link createBed}, by kind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds; each band names its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension per kind, keyed by the producer's closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Kept beside the producer so the producer stays one readable construction; it re-exports as `createBed.BANDS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A regulation's limit is taken where it gives no maker's figure, and said to be.
 */
export const BED_BANDS: Readonly<
  Record<
    createBed.Kind,
    Readonly<Partial<Record<createBed.Dimension, IArchetypeBand>>>
  >
> = {
  single: {
    width: ArchetypeBand.metres(0.9, 0.9, SIZES),
    length: ArchetypeBand.metres(1.9, 1.9, SIZES),
    height: ArchetypeBand.metres(0.39, 0.63, HEIGHT),
    thickness: ArchetypeBand.metres(0.15, 0.25, MATTRESS, true),
    mass: ArchetypeBand.of("kg", 30, 50, ArchetypeBand.TYPICAL_MASS, true),
  },
  double: {
    width: ArchetypeBand.metres(1.35, 1.35, SIZES),
    length: ArchetypeBand.metres(1.9, 1.9, SIZES),
    height: ArchetypeBand.metres(0.39, 0.63, HEIGHT),
    thickness: ArchetypeBand.metres(0.15, 0.25, MATTRESS, true),
    mass: ArchetypeBand.of("kg", 45, 75, ArchetypeBand.TYPICAL_MASS, true),
  },
  mattress: {
    width: ArchetypeBand.metres(0.9, 1.35, SIZES),
    length: ArchetypeBand.metres(1.9, 1.9, SIZES),
    thickness: ArchetypeBand.metres(0.15, 0.25, MATTRESS, true),
    mass: ArchetypeBand.of("kg", 10, 30, ArchetypeBand.TYPICAL_MASS, true),
  },
  hospital: {
    width: ArchetypeBand.metres(0.91, 0.91, `${GOBED}: the patient surface`),
    length: ArchetypeBand.metres(2.13, 2.13, `${GOBED}: the patient surface`),
    overallLength: ArchetypeBand.metres(2.394, 2.394, GOBED),
    overallWidth: ArchetypeBand.metres(1.016, 1.016, GOBED),
    litter: ArchetypeBand.metres(
      0.368,
      0.737,
      `${GOBED}: the litter top's range`,
    ),
    thickness: ArchetypeBand.metres(0.152, 0.152, ISOFLEX, true),
    rail: ArchetypeBand.metres(0.22, 0.22, SIDERAIL, true),
    mass: ArchetypeBand.of("kg", 150, 250, ArchetypeBand.TYPICAL_MASS, true),
  },
  crib: {
    width: ArchetypeBand.metres(
      0.6942,
      0.7258,
      `${CRIB}: the interior's width`,
    ),
    length: ArchetypeBand.metres(
      1.3144,
      1.346,
      `${CRIB}: the interior's length`,
    ),
    rail: ArchetypeBand.metres(
      0.66,
      0.66,
      `${CRIB}: the rail's top above the support at its lowest; the model takes the least`,
    ),
    height: ArchetypeBand.metres(0.851, 0.921, CRIB_TOP, true),
    thickness: ArchetypeBand.metres(
      0.152,
      0.152,
      `${CRIB}: the mattress's greatest thickness, which the model takes`,
    ),
    mass: ArchetypeBand.of("kg", 20, 35, ArchetypeBand.TYPICAL_MASS, true),
  },
  bunk: {
    width: ArchetypeBand.metres(0.9, 0.9, `${MYDAL}: the mattress`),
    length: ArchetypeBand.metres(2, 2, `${MYDAL}: the mattress`),
    overallLength: ArchetypeBand.metres(2.06, 2.06, MYDAL),
    overallWidth: ArchetypeBand.metres(0.97, 0.97, MYDAL),
    height: ArchetypeBand.metres(1.57, 1.57, MYDAL),
    gap: ArchetypeBand.metres(0.91, 0.91, MYDAL),
    clearance: ArchetypeBand.metres(0.2, 0.2, MYDAL),
    thickness: ArchetypeBand.metres(
      0.1,
      0.19,
      `${MYDAL}: the mattress at most 19 cm; the least is a thin mattress's, not read at a source`,
      true,
    ),
    mass: ArchetypeBand.of("kg", 40, 70, ArchetypeBand.TYPICAL_MASS, true),
  },
};

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeBed } from "../AutoMovieArchetypeBed";
import * as BedBandsData from "./internal/BedBandsData";

/*
 * The band of each free dimension of createBed, by kind.
 */
export const BED_BANDS: Readonly<
  Record<
    AutoMovieArchetypeBed.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeBed.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  single: {
    width: AutoMovieArchetypeBand.metres(0.9, 0.9, BedBandsData.SIZES),
    length: AutoMovieArchetypeBand.metres(1.9, 1.9, BedBandsData.SIZES),
    height: AutoMovieArchetypeBand.metres(0.39, 0.63, BedBandsData.HEIGHT),
    thickness: AutoMovieArchetypeBand.metres(0.15, 0.25, BedBandsData.MATTRESS, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      30,
      50,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  double: {
    width: AutoMovieArchetypeBand.metres(1.35, 1.35, BedBandsData.SIZES),
    length: AutoMovieArchetypeBand.metres(1.9, 1.9, BedBandsData.SIZES),
    height: AutoMovieArchetypeBand.metres(0.39, 0.63, BedBandsData.HEIGHT),
    thickness: AutoMovieArchetypeBand.metres(0.15, 0.25, BedBandsData.MATTRESS, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      45,
      75,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  mattress: {
    thickness: AutoMovieArchetypeBand.metres(0.15, 0.25, BedBandsData.MATTRESS, true),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      10,
      30,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  hospital: {
    width: AutoMovieArchetypeBand.metres(
      0.91,
      0.91,
      `${BedBandsData.GOBED}: the patient surface`,
    ),
    length: AutoMovieArchetypeBand.metres(
      2.13,
      2.13,
      `${BedBandsData.GOBED}: the patient surface`,
    ),
    overallLength: AutoMovieArchetypeBand.metres(2.394, 2.394, BedBandsData.GOBED),
    overallWidth: AutoMovieArchetypeBand.metres(1.016, 1.016, BedBandsData.GOBED),
    litter: AutoMovieArchetypeBand.metres(
      0.368,
      0.737,
      `${BedBandsData.GOBED}: the litter top's range`,
    ),
    thickness: AutoMovieArchetypeBand.metres(0.15, 0.15, BedBandsData.ISOFLEX, true),
    rail: AutoMovieArchetypeBand.metres(0.22, 0.22, BedBandsData.SIDERAIL),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      150,
      250,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  gurney: {
    width: AutoMovieArchetypeBand.metres(
      26 * AutoMovieArchetypeUnits.INCH,
      26 * AutoMovieArchetypeUnits.INCH,
      `${BedBandsData.PRIME}: the patient surface`,
    ),
    length: AutoMovieArchetypeBand.metres(
      75.25 * AutoMovieArchetypeUnits.INCH,
      75.25 * AutoMovieArchetypeUnits.INCH,
      `${BedBandsData.PRIME}: the patient surface`,
    ),
    overallLength: AutoMovieArchetypeBand.metres(
      85 * AutoMovieArchetypeUnits.INCH,
      85 * AutoMovieArchetypeUnits.INCH,
      BedBandsData.PRIME,
    ),
    overallWidth: AutoMovieArchetypeBand.metres(
      26 * AutoMovieArchetypeUnits.INCH,
      26 * AutoMovieArchetypeUnits.INCH,
      `${BedBandsData.PRIME}: with the siderails down`,
    ),
    litter: AutoMovieArchetypeBand.metres(
      0.527,
      0.864,
      `${BedBandsData.PRIME}: the height range`,
    ),
    thickness: AutoMovieArchetypeBand.metres(0.14, 0.14, BedBandsData.PRIME),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      80,
      120,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  crib: {
    width: AutoMovieArchetypeBand.metres(
      (28 - 5 / 8) * AutoMovieArchetypeUnits.INCH,
      (28 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      `${BedBandsData.CRIB}: the interior's width`,
    ),
    length: AutoMovieArchetypeBand.metres(
      (52 + 3 / 8 - 5 / 8) * AutoMovieArchetypeUnits.INCH,
      (52 + 3 / 8 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      `${BedBandsData.CRIB}: the interior's length`,
    ),
    rail: AutoMovieArchetypeBand.metres(
      26 * AutoMovieArchetypeUnits.INCH,
      26 * AutoMovieArchetypeUnits.INCH,
      `${BedBandsData.CRIB}: the rail's top above the support at its lowest; the model takes the least`,
    ),
    height: AutoMovieArchetypeBand.metres(
      35 * AutoMovieArchetypeUnits.INCH,
      35 * AutoMovieArchetypeUnits.INCH,
      BedBandsData.CRIB_TOP,
    ),
    thickness: AutoMovieArchetypeBand.metres(
      6 * AutoMovieArchetypeUnits.INCH,
      6 * AutoMovieArchetypeUnits.INCH,
      `${BedBandsData.CRIB}: the mattress's greatest thickness, which the model takes`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      20,
      35,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  bunk: {
    width: AutoMovieArchetypeBand.metres(0.9, 0.9, `${BedBandsData.MYDAL}: the mattress`),
    length: AutoMovieArchetypeBand.metres(2, 2, `${BedBandsData.MYDAL}: the mattress`),
    overallLength: AutoMovieArchetypeBand.metres(2.06, 2.06, BedBandsData.MYDAL),
    overallWidth: AutoMovieArchetypeBand.metres(0.97, 0.97, BedBandsData.MYDAL),
    height: AutoMovieArchetypeBand.metres(1.57, 1.57, BedBandsData.MYDAL),
    gap: AutoMovieArchetypeBand.metres(0.91, 0.91, BedBandsData.MYDAL),
    clearance: AutoMovieArchetypeBand.metres(0.2, 0.2, BedBandsData.MYDAL),
    thickness: AutoMovieArchetypeBand.metres(
      0.1,
      0.19,
      `${BedBandsData.MYDAL}: the mattress at most 19 cm; the least is a thin mattress's, not read at a source`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      70,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
};

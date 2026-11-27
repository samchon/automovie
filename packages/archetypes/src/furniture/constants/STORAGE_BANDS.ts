import { ADA_RANGES } from "../../architecture/constants/ADA_RANGES";
import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeStorage } from "../AutoMovieArchetypeStorage";
import * as StorageBandsData from "./internal/StorageBandsData";

/*
 * The band of each free dimension of createStorage, by kind, but those
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
      `${StorageBandsData.ADM}: double wardrobe 600 x 1200 mm`,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.6,
      0.6,
      `${StorageBandsData.ADM}: double wardrobe 600 x 1200 mm`,
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
      `${StorageBandsData.ADM}: chest of drawers 450 x 750 mm`,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.45,
      0.45,
      `${StorageBandsData.ADM}: chest of drawers 450 x 750 mm`,
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
      StorageBandsData.HON,
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      25 * AutoMovieArchetypeUnits.INCH,
      25 * AutoMovieArchetypeUnits.INCH,
      StorageBandsData.HON,
      true,
    ),
    height: AutoMovieArchetypeBand.metres(
      52 * AutoMovieArchetypeUnits.INCH,
      52 * AutoMovieArchetypeUnits.INCH,
      StorageBandsData.HON,
      true,
    ),
    travel: AutoMovieArchetypeBand.metres(
      (23 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      (23 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      `${StorageBandsData.HON}: a full-suspension drawer drawn its whole filing length`,
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
      `${StorageBandsData.LYON}: the 72 in opening`,
    ),
    legs: AutoMovieArchetypeBand.metres(
      6 * AutoMovieArchetypeUnits.INCH,
      6 * AutoMovieArchetypeUnits.INCH,
      `${StorageBandsData.LYON}: 6 in legs`,
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
    width: AutoMovieArchetypeBand.metres(0.8, 0.8, StorageBandsData.BILLY),
    depth: AutoMovieArchetypeBand.metres(0.28, 0.28, StorageBandsData.BILLY),
    height: AutoMovieArchetypeBand.metres(2.02, 2.02, StorageBandsData.BILLY),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      30,
      38,
      `${StorageBandsData.BILLY}: 36.85 kg packed, the assembled bookcase a little less`,
      true,
    ),
  },
};

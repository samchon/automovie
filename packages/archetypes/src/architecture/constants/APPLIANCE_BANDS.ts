import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../../core";
import { ADA_RANGES } from "./ADA_RANGES";
import type { AutoMovieArchetypeAppliance } from "../AutoMovieArchetypeAppliance";
import { ApplianceBandsData } from "./internal/ApplianceBandsData";

/*
 * The band of each free dimension of createAppliance, by kind.
 */
export const APPLIANCE_BANDS: Readonly<
  Record<
    AutoMovieArchetypeAppliance.Kind,
    Readonly<
      Partial<Record<AutoMovieArchetypeAppliance.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  refrigerator: {
    height: AutoMovieArchetypeBand.metres(
      1.86,
      2.03,
      `${ApplianceBandsData.FRIDGE}; ${ApplianceBandsData.TALL}`,
      true,
    ),
    width: AutoMovieArchetypeBand.metres(0.6, 0.6, ApplianceBandsData.FRIDGE),
    depth: AutoMovieArchetypeBand.metres(0.66, 0.66, ApplianceBandsData.FRIDGE),
    pullHeight: AutoMovieArchetypeBand.metres(
      ADA_RANGES.hardware.low,
      ADA_RANGES.hardware.high,
      `${ADA_RANGES.hardware.source}; a cabinet's pulls share door hardware's range within ${ADA_RANGES.reach.source}`,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 62, 82, `${ApplianceBandsData.FRIDGE}; ${ApplianceBandsData.TALL}`, true),
  },
  cooker: {
    height: AutoMovieArchetypeBand.metres(0.85, 0.92, ApplianceBandsData.COOKERS),
    width: AutoMovieArchetypeBand.metres(0.6, 0.6, ApplianceBandsData.COOKERS),
    depth: AutoMovieArchetypeBand.metres(
      0.6,
      0.6,
      "Bosch HLS79R350A, 850 x 600 x 600 mm, as a search result gives Bosch's sheet; not read",
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
  microwave: {
    height: AutoMovieArchetypeBand.metres(0.26, 0.26, ApplianceBandsData.MICROWAVE),
    width: AutoMovieArchetypeBand.metres(0.442, 0.442, ApplianceBandsData.MICROWAVE),
    depth: AutoMovieArchetypeBand.metres(0.345, 0.345, ApplianceBandsData.MICROWAVE),
    cavityHeight: AutoMovieArchetypeBand.metres(0.18, 0.18, ApplianceBandsData.MICROWAVE),
    cavityWidth: AutoMovieArchetypeBand.metres(0.28, 0.28, ApplianceBandsData.MICROWAVE),
    cavityDepth: AutoMovieArchetypeBand.metres(0.3, 0.3, ApplianceBandsData.MICROWAVE),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      12.2,
      12.5,
      `${ApplianceBandsData.MICROWAVE}; 12.5 kg as a retailer gives it, a search result only`,
      true,
    ),
  },
  washingMachine: {
    height: AutoMovieArchetypeBand.metres(
      0.845,
      0.848,
      `${ApplianceBandsData.WASHER}; Bosch WAN28108GB at 848 mm, a search result only`,
      true,
    ),
    width: AutoMovieArchetypeBand.metres(0.598, 0.598, ApplianceBandsData.WASHER),
    depth: AutoMovieArchetypeBand.metres(0.59, 0.59, ApplianceBandsData.WASHER),
    door: AutoMovieArchetypeBand.metres(
      0.459,
      0.459,
      `${ApplianceBandsData.WASHER}: the door opened square projects its own width, 1049 less 590 mm`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      66.3,
      70.3,
      `${ApplianceBandsData.WASHER}; 70.3 kg for Bosch WAE28368GB, a search result only`,
      true,
    ),
  },
};

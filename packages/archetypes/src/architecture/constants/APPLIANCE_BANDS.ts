import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../../core";
import { ADA_RANGES } from "./ADA_RANGES";
import type { AutoMovieArchetypeAppliance } from "../AutoMovieArchetypeAppliance";

/** The fridge-freezer read. */
const FRIDGE: string =
  "Bosch KGN36NL30M, 1860 x 600 x 660 mm with the handle, 62.0 kg, four fridge shelves, right hinge (https://bosch-home.com/ae/en/mkt-product/fridges-freezers/fridge-freezers/freestanding-fridge-freezers-with-freezer-at-bottom/KGN36NL30M)";

/** The taller fridge-freezers, from a search only. */
const TALL: string =
  "Bosch KGN39 fridge-freezers, 2030 x 600 x 660 to 665 mm and 69 to 82 kg, as search results give Bosch's sheets; not read";

/** The maker's cookers, read. */
const COOKERS: string =
  "Bosch freestanding cookers: 60 cm wide, 85 to 92 cm high to suit the worktop (https://www.bosch-home.com/ne/en/mkt-category-page/cooking-baking/freestanding-cookers)";

/** The microwave read. */
const MICROWAVE: string =
  "Bosch FFL020MS2B, 260 x 442 x 345 mm, cavity 180 x 280 x 300 mm, 12.2 kg (https://www.bosch-home.ie/en/mkt-product/cooking-baking/microwaves/freestanding-microwave/FFL020MS2B)";

/** The washing machine read. */
const WASHER: string =
  "Bosch WAN28255GB, 845 x 598 x 590 mm, 1049 mm deep with the door open at 90 degrees, 66.3 kg (https://www.bosch-home.com/mt/en/mkt-product/washers-dryers/washing-machines/frontloader/WAN28255GB)";

/** The band of each free dimension of {@link createAppliance}, by kind. */
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
      `${FRIDGE}; ${TALL}`,
      true,
    ),
    width: AutoMovieArchetypeBand.metres(0.6, 0.6, FRIDGE),
    depth: AutoMovieArchetypeBand.metres(0.66, 0.66, FRIDGE),
    pullHeight: AutoMovieArchetypeBand.metres(
      ADA_RANGES.hardware.low,
      ADA_RANGES.hardware.high,
      `${ADA_RANGES.hardware.source}; a cabinet's pulls share door hardware's range within ${ADA_RANGES.reach.source}`,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 62, 82, `${FRIDGE}; ${TALL}`, true),
  },
  cooker: {
    height: AutoMovieArchetypeBand.metres(0.85, 0.92, COOKERS),
    width: AutoMovieArchetypeBand.metres(0.6, 0.6, COOKERS),
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
    height: AutoMovieArchetypeBand.metres(0.26, 0.26, MICROWAVE),
    width: AutoMovieArchetypeBand.metres(0.442, 0.442, MICROWAVE),
    depth: AutoMovieArchetypeBand.metres(0.345, 0.345, MICROWAVE),
    cavityHeight: AutoMovieArchetypeBand.metres(0.18, 0.18, MICROWAVE),
    cavityWidth: AutoMovieArchetypeBand.metres(0.28, 0.28, MICROWAVE),
    cavityDepth: AutoMovieArchetypeBand.metres(0.3, 0.3, MICROWAVE),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      12.2,
      12.5,
      `${MICROWAVE}; 12.5 kg as a retailer gives it, a search result only`,
      true,
    ),
  },
  washingMachine: {
    height: AutoMovieArchetypeBand.metres(
      0.845,
      0.848,
      `${WASHER}; Bosch WAN28108GB at 848 mm, a search result only`,
      true,
    ),
    width: AutoMovieArchetypeBand.metres(0.598, 0.598, WASHER),
    depth: AutoMovieArchetypeBand.metres(0.59, 0.59, WASHER),
    door: AutoMovieArchetypeBand.metres(
      0.459,
      0.459,
      `${WASHER}: the door opened square projects its own width, 1049 less 590 mm`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      66.3,
      70.3,
      `${WASHER}; 70.3 kg for Bosch WAE28368GB, a search result only`,
      true,
    ),
  },
};

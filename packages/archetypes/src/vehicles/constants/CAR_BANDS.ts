import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeCar } from "../AutoMovieArchetypeCar";
import "./CAR_MODELS";
import * as CarBandsData from "./internal/CarBandsData";
import { hatchbacks } from "./internal/CarBandsData";

/*
 * The band of each free dimension of a car, by class, with the source it was
 * read at; `AutoMovieArchetypeCar.BANDS` is this table. A class lacks the
 * dimensions of the parts it does not have: only the sedan and the hatchback
 * have a boot, only the van a sliding door and a cargo floor, only the pickup a
 * bed. A model's own figures are its read model's (`CAR_MODELS`), not bands;
 * the van's sliding door, step and cargo floor are the L1's read figures, the
 * L2's dealer page giving the same 1,030 mm door and none of the others, so the
 * L2 takes the L1's, the same body section: provisional for the L2.
 */
export const CAR_BANDS: Readonly<
  Record<
    AutoMovieArchetypeCar.Kind,
    Readonly<
      Partial<Record<AutoMovieArchetypeCar.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  hatchback: {
    ...CarBandsData.SHARED,
    ...CarBandsData.CAR,
  },
  sedan: {
    ...CarBandsData.SHARED,
    ...CarBandsData.CAR,
    lockTurns: CarBandsData.TURNS,
    wheelDiameter: AutoMovieArchetypeBand.metres(
      ...hatchbacks("wheelDiameter"),
      `${CarBandsData.HATCH}: the span of the grades' tyres' outer diameters, computed from their sizes, borrowed for want of a sedan's read tyre`,
      true,
    ),
  },
  van: {
    ...CarBandsData.SHARED,
    seatHeight: CarBandsData.COMMERCIAL_SEAT,
    lockTurns: CarBandsData.TURNS,
    steeringRatio: AutoMovieArchetypeBand.of(
      "",
      15.7,
      15.7,
      `${CarBandsData.VAN}: ratio 15.7:1`,
    ),
    sideDoorWidth: AutoMovieArchetypeBand.metres(
      1.03,
      1.03,
      `${CarBandsData.VAN}: side door aperture width`,
    ),
    sideDoorHeight: AutoMovieArchetypeBand.metres(
      1.301,
      1.301,
      `${CarBandsData.VAN}: side door aperture height`,
    ),
    sideStep: AutoMovieArchetypeBand.metres(
      0.393,
      0.435,
      `${CarBandsData.VAN}: side door step height`,
    ),
    cargoFloor: AutoMovieArchetypeBand.metres(
      0.575,
      0.593,
      `${CarBandsData.VAN}: rear door loading height`,
    ),
  },
  pickup: {
    ...CarBandsData.SHARED,
    seatHeight: CarBandsData.COMMERCIAL_SEAT,
    steeringRatio: CarBandsData.CAR.steeringRatio,
    lockTurns: CarBandsData.TURNS,
    length: AutoMovieArchetypeBand.metres(
      210.6 * AutoMovieArchetypeUnits.INCH,
      210.6 * AutoMovieArchetypeUnits.INCH,
      CarBandsData.PICKUP,
    ),
    width: AutoMovieArchetypeBand.metres(
      75.5 * AutoMovieArchetypeUnits.INCH,
      75.5 * AutoMovieArchetypeUnits.INCH,
      `${CarBandsData.PICKUP}: width excluding mirrors`,
    ),
    wheelbase: AutoMovieArchetypeBand.metres(
      128.7 * AutoMovieArchetypeUnits.INCH,
      128.7 * AutoMovieArchetypeUnits.INCH,
      CarBandsData.PICKUP,
    ),
    bedLength: AutoMovieArchetypeBand.metres(
      59.6 * AutoMovieArchetypeUnits.INCH,
      59.6 * AutoMovieArchetypeUnits.INCH,
      `${CarBandsData.PICKUP}: cargo bed length at floor`,
    ),
    bedWidth: AutoMovieArchetypeBand.metres(
      62.4 * AutoMovieArchetypeUnits.INCH,
      62.4 * AutoMovieArchetypeUnits.INCH,
      `${CarBandsData.PICKUP}: maximum width inside the box`,
    ),
    bedDepth: AutoMovieArchetypeBand.metres(
      20.8 * AutoMovieArchetypeUnits.INCH,
      20.9 * AutoMovieArchetypeUnits.INCH,
      "a 2024-2025 Ranger SuperCrew bed's inside height, 20.8 to 20.9 in, in dealers' and outfitters' guides (https://www.greghublerford.com/2024-ford-ranger-bed-size/, https://offroadtents.com/blogs/news/ford-ranger-bed-dimensions-guide-for-every-model), seen in search results only",
      true,
    ),
  },
};

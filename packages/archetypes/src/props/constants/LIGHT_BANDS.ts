import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeLight } from "../AutoMovieArchetypeLight";
import { LightBandsData } from "./internal/LightBandsData";

/*
 * The band of each free dimension of `createLight`, by kind, with the sources
 * they are read at: kept apart from the producer so each file stays within its
 * size.
 */
export const LIGHT_BANDS: Readonly<
  Record<
    AutoMovieArchetypeLight.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeLight.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  candle: {
    length: AutoMovieArchetypeBand.metres(0.25, 0.26, LightBandsData.TAPER, true),
    diameter: AutoMovieArchetypeBand.metres(0.022, 0.022, LightBandsData.TAPER, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.0645, 0.0645, LightBandsData.TAPER, true),
  },
  fireTorch: {
    length: AutoMovieArchetypeBand.metres(
      16 * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      LightBandsData.TORCH,
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(0.03, 0.04, LightBandsData.POWER, true),
    headDiameter: AutoMovieArchetypeBand.metres(0.065, 0.065, LightBandsData.TORCH, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.205, 0.265, LightBandsData.TORCH, true),
  },
  pendant: {
    height: AutoMovieArchetypeBand.metres(
      11 * AutoMovieArchetypeUnits.INCH,
      11 * AutoMovieArchetypeUnits.INCH,
      LightBandsData.PENDANT,
    ),
    shade: AutoMovieArchetypeBand.metres(
      15 * AutoMovieArchetypeUnits.INCH,
      15 * AutoMovieArchetypeUnits.INCH,
      LightBandsData.PENDANT,
    ),
    cord: AutoMovieArchetypeBand.metres(
      4 * AutoMovieArchetypeUnits.FOOT + 11 * AutoMovieArchetypeUnits.INCH,
      4 * AutoMovieArchetypeUnits.FOOT + 11 * AutoMovieArchetypeUnits.INCH,
      LightBandsData.PENDANT,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 1.35, 1.37, LightBandsData.PENDANT, true),
  },
  tableLamp: {
    overall: AutoMovieArchetypeBand.metres(0.41, 0.41, LightBandsData.TABLE_LAMP),
    stem: AutoMovieArchetypeBand.metres(0.3, 0.3, LightBandsData.TABLE_LAMP),
    base: AutoMovieArchetypeBand.metres(0.15, 0.15, LightBandsData.TABLE_LAMP),
    height: AutoMovieArchetypeBand.metres(0.15, 0.15, LightBandsData.TABLE_LAMP),
    shade: AutoMovieArchetypeBand.metres(0.19, 0.19, LightBandsData.TABLE_LAMP),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.62 + 0.19,
      0.62 + 0.19,
      `${LightBandsData.TABLE_LAMP}: the base's and the shade's net weights together`,
      true,
    ),
  },
  floorLamp: {
    overall: AutoMovieArchetypeBand.metres(1.53, 1.53, LightBandsData.FLOOR_LAMP),
    stem: AutoMovieArchetypeBand.metres(1.3, 1.3, LightBandsData.FLOOR_LAMP),
    base: AutoMovieArchetypeBand.metres(0.29, 0.29, LightBandsData.FLOOR_LAMP),
    height: AutoMovieArchetypeBand.metres(0.31, 0.31, LightBandsData.FLOOR_LAMP),
    shade: AutoMovieArchetypeBand.metres(0.42, 0.42, LightBandsData.FLOOR_LAMP),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      3.06 + 0.49,
      3.06 + 0.49,
      `${LightBandsData.FLOOR_LAMP}: the base's and the shade's net weights together`,
    ),
  },
  lantern: {
    overall: AutoMovieArchetypeBand.metres(
      12 * AutoMovieArchetypeUnits.INCH,
      12 * AutoMovieArchetypeUnits.INCH,
      LightBandsData.LANTERN,
    ),
    bail: AutoMovieArchetypeBand.metres(
      16 * AutoMovieArchetypeUnits.INCH,
      16 * AutoMovieArchetypeUnits.INCH,
      LightBandsData.LANTERN,
    ),
    base: AutoMovieArchetypeBand.metres(
      (5 + 1 / 4) * AutoMovieArchetypeUnits.INCH,
      (5 + 1 / 4) * AutoMovieArchetypeUnits.INCH,
      LightBandsData.LANTERN,
    ),
    height: AutoMovieArchetypeBand.metres(
      (5 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      (5 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      LightBandsData.LANTERN,
    ),
    shade: AutoMovieArchetypeBand.metres(
      (2 + 13 / 16) * AutoMovieArchetypeUnits.INCH,
      (2 + 13 / 16) * AutoMovieArchetypeUnits.INCH,
      LightBandsData.LANTERN,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      2 * AutoMovieArchetypeUnits.POUND,
      2 * AutoMovieArchetypeUnits.POUND,
      LightBandsData.LANTERN,
    ),
  },
};

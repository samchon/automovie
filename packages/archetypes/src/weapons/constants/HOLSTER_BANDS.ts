import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeHolster } from "../AutoMovieArchetypeHolster";
import { HolsterBandsData } from "./internal/HolsterBandsData";

/*
 * The band of each free dimension of `createHolster` a ride or a blade leaves,
 * by kind, with the sources they are read at: kept apart from the producer,
 * with the blades its scabbards are made to, so each file stays within its
 * size.
 */
export const HOLSTER_BANDS: Readonly<
  Record<
    AutoMovieArchetypeHolster.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeHolster.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  holster: {
    depth: AutoMovieArchetypeBand.of(
      "m",
      0.12,
      0.16,
      "pouch depth for a 102 to 119 mm barrel, an estimate",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.15,
      0.3,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  scabbard: {
    thickness: AutoMovieArchetypeBand.metres(0.015, 0.025, HolsterBandsData.UNREAD, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.3, 0.6, HolsterBandsData.UNREAD, true),
  },
  sheath: {
    thickness: AutoMovieArchetypeBand.metres(0.012, 0.02, HolsterBandsData.UNREAD, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.05, 0.15, HolsterBandsData.UNREAD, true),
  },
  quiver: {
    length: AutoMovieArchetypeBand.metres(
      18 * AutoMovieArchetypeUnits.INCH,
      22.5 * AutoMovieArchetypeUnits.INCH,
      HolsterBandsData.QUIVER,
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      3.5 * AutoMovieArchetypeUnits.INCH,
      3.5 * AutoMovieArchetypeUnits.INCH,
      HolsterBandsData.QUIVER,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.62,
      1.5 * AutoMovieArchetypeUnits.POUND,
      HolsterBandsData.QUIVER,
      true,
    ),
  },
  pouch: {
    length: AutoMovieArchetypeBand.metres(
      7.7 * AutoMovieArchetypeUnits.INCH,
      7.7 * AutoMovieArchetypeUnits.INCH,
      HolsterBandsData.BOX,
    ),
    thickness: AutoMovieArchetypeBand.metres(
      1.6 * AutoMovieArchetypeUnits.INCH,
      1.6 * AutoMovieArchetypeUnits.INCH,
      HolsterBandsData.BOX,
    ),
    depth: AutoMovieArchetypeBand.metres(
      5.8 * AutoMovieArchetypeUnits.INCH,
      5.8 * AutoMovieArchetypeUnits.INCH,
      HolsterBandsData.BOX,
    ),
    width: AutoMovieArchetypeBand.metres(
      8.5 * AutoMovieArchetypeUnits.INCH,
      8.5 * AutoMovieArchetypeUnits.INCH,
      `${HolsterBandsData.BOX}: the flap's width at its bottom`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.3,
      0.6,
      `${AutoMovieArchetypeBand.TYPICAL_MASS}: an empty leather box with its two tins, an estimate; no empty weight is given (searched: the 1841, 1850 and 1861 Ordnance Manuals, Colonial Williamsburg; records-cartridge-pouch.md)`,
      true,
    ),
  },
};

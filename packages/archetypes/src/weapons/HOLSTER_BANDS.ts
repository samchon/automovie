import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { AutoMovieArchetypeHolster } from "./AutoMovieArchetypeHolster";

/** What no scabbard maker read gives. */
const UNREAD: string =
  "no scabbard's thickness or weight was found in the makers' pages read";

/** Back quivers, seen only in search results. */
const QUIVER: string =
  "back quivers 18 to 22.5 in deep (Bear Archery, Martin Flint, Vista Honcho) and 3.5 in across (Dark Knight Armoury), capacities to 50 arrows (TOPARCHERY), and 20 in quivers weighing 0.62 kg (MAYARMS) and 1.5 lb (CH Narchery), seen only in search results";

/**
 * The US infantry cartridge box of 1841, read at the Ordnance Manual's page
 * images.
 */
const BOX: string =
  "the 1841 Ordnance Manual, the infantry cartridge box: 7.7 in long, 1.6 in wide, 5.8 in deep at the front, its flap 8.5 in wide at the bottom; two tins, each with a lower part 3 x 3.3 in for a bundle of 10 cartridges and two upper parts 2.7 in deep, 2 x 1.35 in for 6 and 1.35 in square for 4, 40 rounds in all, p. 140 (https://archive.org/details/vol1841ordnancem00unit)";

/**
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
    thickness: AutoMovieArchetypeBand.metres(0.015, 0.025, UNREAD, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.3, 0.6, UNREAD, true),
  },
  sheath: {
    thickness: AutoMovieArchetypeBand.metres(0.012, 0.02, UNREAD, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.05, 0.15, UNREAD, true),
  },
  quiver: {
    length: AutoMovieArchetypeBand.metres(
      18 * AutoMovieArchetypeUnits.INCH,
      22.5 * AutoMovieArchetypeUnits.INCH,
      QUIVER,
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      3.5 * AutoMovieArchetypeUnits.INCH,
      3.5 * AutoMovieArchetypeUnits.INCH,
      QUIVER,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.62,
      1.5 * AutoMovieArchetypeUnits.POUND,
      QUIVER,
      true,
    ),
  },
  pouch: {
    length: AutoMovieArchetypeBand.metres(
      7.7 * AutoMovieArchetypeUnits.INCH,
      7.7 * AutoMovieArchetypeUnits.INCH,
      BOX,
    ),
    thickness: AutoMovieArchetypeBand.metres(
      1.6 * AutoMovieArchetypeUnits.INCH,
      1.6 * AutoMovieArchetypeUnits.INCH,
      BOX,
    ),
    depth: AutoMovieArchetypeBand.metres(
      5.8 * AutoMovieArchetypeUnits.INCH,
      5.8 * AutoMovieArchetypeUnits.INCH,
      BOX,
    ),
    width: AutoMovieArchetypeBand.metres(
      8.5 * AutoMovieArchetypeUnits.INCH,
      8.5 * AutoMovieArchetypeUnits.INCH,
      `${BOX}: the flap's width at its bottom`,
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

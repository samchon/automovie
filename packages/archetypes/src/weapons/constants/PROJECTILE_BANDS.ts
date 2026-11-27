import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { AutoMovieArchetypeRock } from "../../nature/AutoMovieArchetypeRock";
import type { AutoMovieArchetypeProjectile } from "../AutoMovieArchetypeProjectile";
import * as ProjectileBandsData from "./internal/ProjectileBandsData";

/*
 * The band of each free dimension of createProjectile an object leaves,
 * by kind, with the sources they are read at: kept apart from the producer so
 * each file stays within its size. Read only as `createProjectile.BANDS`; an
 * arrow's and a bolt's provisional bands are drawn only for the object that
 * does not give the figure, a stone's specific gravity is granite's as
 * `createRock` reads it, and every band names its source.
 */
export const PROJECTILE_BANDS: Readonly<
  Record<
    AutoMovieArchetypeProjectile.Kind,
    Readonly<
      Partial<Record<AutoMovieArchetypeProjectile.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  ball: {
    diameter: AutoMovieArchetypeBand.metres(
      0.66 * AutoMovieArchetypeUnits.INCH,
      0.72 * AutoMovieArchetypeUnits.INCH,
      ProjectileBandsData.BALL,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      AutoMovieArchetypeUnits.POUND / 14,
      AutoMovieArchetypeUnits.POUND / 14,
      `${ProjectileBandsData.BALL}: a pound over fourteen`,
      true,
    ),
  },
  arrow: {
    length: AutoMovieArchetypeBand.metres(0.715, 0.854, ProjectileBandsData.ARROW),
    diameter: AutoMovieArchetypeBand.metres(
      0.011,
      0.013,
      `${ProjectileBandsData.ARROW}: AZ472/19's own not stated`,
      true,
    ),
  },
  bolt: {
    diameter: AutoMovieArchetypeBand.metres(
      0.0136,
      0.0136,
      `${ProjectileBandsData.BOLT}: Met 33754's shaft not stated; NMM 11461's, the one read`,
      true,
    ),
  },
  roundShot: {},
  grenade: {
    diameter: AutoMovieArchetypeBand.metres(
      2.5 * AutoMovieArchetypeUnits.INCH,
      2.5 * AutoMovieArchetypeUnits.INCH,
      ProjectileBandsData.M67,
    ),
    length: AutoMovieArchetypeBand.metres(
      3.53 * AutoMovieArchetypeUnits.INCH,
      3.53 * AutoMovieArchetypeUnits.INCH,
      ProjectileBandsData.M67,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      14 * AutoMovieArchetypeUnits.OUNCE,
      14 * AutoMovieArchetypeUnits.OUNCE,
      ProjectileBandsData.M67,
    ),
  },
  cartridge: {
    diameter: AutoMovieArchetypeBand.metres(
      0.65 * AutoMovieArchetypeUnits.INCH,
      0.65 * AutoMovieArchetypeUnits.INCH,
      `${ProjectileBandsData.CARTRIDGE}: the paper rolled on a former "of the same diameter as the ball", the ball .65 in; the paper's thickness, unread, not added`,
      true,
    ),
    length: AutoMovieArchetypeBand.metres(
      2.6 * AutoMovieArchetypeUnits.INCH,
      2.6 * AutoMovieArchetypeUnits.INCH,
      `${ProjectileBandsData.CARTRIDGE}: the bundle of ten 2.6 in long, the bundling box's "length that of the cartridge"`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      (13.2 * AutoMovieArchetypeUnits.OUNCE) / 10,
      (13.2 * AutoMovieArchetypeUnits.OUNCE) / 10,
      `${ProjectileBandsData.CARTRIDGE}: "Weight of 10 cartridges" 13.2 oz`,
    ),
  },
  stone: {
    mass: AutoMovieArchetypeBand.of("kg", 0.5, 1, ProjectileBandsData.STONE),
    gravity: AutoMovieArchetypeRock.BANDS.cobble.gravity,
  },
};

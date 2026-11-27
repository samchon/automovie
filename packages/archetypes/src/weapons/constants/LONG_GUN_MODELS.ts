import { AutoMovieArchetypeUnits } from "../../core";
import type { AutoMovieArchetypeLongGun } from "../AutoMovieArchetypeLongGun";

/**
 * Each kind's models whole, the default first: the Colt sheet's weights, 6.9 lb
 * (3.13 kg), 6.5 lb (2.95 kg) and 6.4 lb (2.90 kg); the Short Land musket's
 * length and barrel (Museums Victoria ST 21813); the M1903's 43.46 in, 8.69 lb
 * and 2,647 ft/s with M1 ball (TM 9-1270, 1944, par. 4, pp. 18-19,
 * https://archive.org/download/1944TM9-1270/1944TM9-1270_djvu.txt), and the Kar
 * 98k's 43.5 in, 23.4 in barrel, about 9 lb and about 2,800 ft/s (War
 * Department, German Infantry Weapons, 1943, p. 23,
 * https://archive.org/download/GermanInfantryWeapons1943/GermanInfantryWeapons1943_djvu.txt,
 * a US assessment, not the maker's). A shotgun and a lever action have one read
 * gun each, their bands.
 */
export const LONG_GUN_MODELS: typeof AutoMovieArchetypeLongGun.MODELS = {
  carbine: {
    r0977hb: { mass: 3.13 },
    r0979: { mass: 2.95 },
    cr6921: { mass: 2.9 },
  },
  musket: {
    shortLand: {
      length: 147.3 * AutoMovieArchetypeUnits.CENTIMETRE,
      barrel: 106.8 * AutoMovieArchetypeUnits.CENTIMETRE,
    },
  },
  rifle: {
    m1903: {
      length: 43.46 * AutoMovieArchetypeUnits.INCH,
      mass: 8.69 * AutoMovieArchetypeUnits.POUND,
      muzzleVelocity: 2647 * AutoMovieArchetypeUnits.FOOT,
    },
    kar98k: {
      length: 43.5 * AutoMovieArchetypeUnits.INCH,
      barrel: 23.4 * AutoMovieArchetypeUnits.INCH,
      mass: 9 * AutoMovieArchetypeUnits.POUND,
      muzzleVelocity: 2800 * AutoMovieArchetypeUnits.FOOT,
    },
  },
};

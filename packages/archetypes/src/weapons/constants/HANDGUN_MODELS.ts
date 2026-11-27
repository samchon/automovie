import { AutoMovieArchetypeUnits } from "../../core";
import type { AutoMovieArchetypeHandgun } from "../AutoMovieArchetypeHandgun";

/*
 * Each frame's pistols whole, the default first, each from its own maker's
 * table:
 *
 * - G17 Gen5: 202 mm long, 139 mm high with magazine, slide 25.5 mm wide, trigger
 *   distance 70 mm, 708 g with an empty magazine
 *   (https://eu.glock.com/en/products/pistols/g17-gen5).
 * - P320-M17: 8.5 in (216 mm) long, 5.5 in (139 mm) high, 6.6 in (168 mm) sight
 *   radius, 29.6 oz (839.1 g), the magazine state not stated
 *   (https://www.sigsauer.com/p320-m17.html; the 216 mm of the two 10-round
 *   SKUs, the first SKU's 6.6 in overall length repeating its sight radius).
 * - G19 Gen5: 185 mm long, 128 mm high, slide 25.5 mm wide, trigger distance 70
 *   mm, 670 g with an empty magazine
 *   (https://eu.glock.com/en/products/pistols/g19-gen5).
 * - P320-M18: 7.2 in (183 mm) long, 5.5 in (140 mm) high, 5.8 in (147 mm) sight
 *   radius, 28.1 oz (797 g), the magazine state not stated
 *   (https://www.sigsauer.com/p320-m18.html).
 * - Single Action Army 7.5 in, as Gun Tests measured it: 13.0 in long, 5.5 in
 *   high, 1.6 in wide, sight radius 8.5 in, trigger span 2.8 in, 40.8 oz
 *   unloaded
 *   (https://www.gun-tests.com/handguns/revolvers/colt-single-action-army-7-5-inch-p1870-45-colt/).
 * - Vaquero 5104, Ruger's spec sheet: barrel 5.50 in, 11.12 in overall, 41 oz
 *   (https://ruger.com/products/vaqueroStainless/specSheets/5104.html).
 * - Light Dragoon pistol, Museums Victoria ST 21852: 39.7 cm long, 14 cm high,
 *   5.5 cm wide, a 9 in barrel
 *   (https://collections.museumsvictoria.com.au/items/373561).
 * - Sea Service pistol, third model, Royal Museums Greenwich AAA2441: overall 180
 *   x 500 x 40 mm, a 12 in barrel
 *   (https://rmg.co.uk/collections/objects/rmgc-object-2440).
 */
export const HANDGUN_MODELS: typeof AutoMovieArchetypeHandgun.MODELS = {
  fullSize: {
    g17: {
      length: 0.202,
      height: 0.139,
      width: 0.0255,
      triggerReach: 0.07,
      mass: 0.708,
    },
    p320m17: {
      length: 0.216,
      height: 0.139,
      sightRadius: 0.168,
      mass: 0.8391,
    },
  },
  compact: {
    g19: {
      length: 0.185,
      height: 0.128,
      width: 0.0255,
      triggerReach: 0.07,
      mass: 0.67,
    },
    p320m18: { length: 0.183, height: 0.14, sightRadius: 0.147, mass: 0.797 },
  },
  revolver: {
    saa75: {
      length: 13 * AutoMovieArchetypeUnits.INCH,
      height: 5.5 * AutoMovieArchetypeUnits.INCH,
      width: 1.6 * AutoMovieArchetypeUnits.INCH,
      barrel: 7.5 * AutoMovieArchetypeUnits.INCH,
      sightRadius: 8.5 * AutoMovieArchetypeUnits.INCH,
      triggerReach: 2.8 * AutoMovieArchetypeUnits.INCH,
      mass: 40.8 * AutoMovieArchetypeUnits.OUNCE,
    },
    vaquero5104: {
      length: 11.12 * AutoMovieArchetypeUnits.INCH,
      barrel: 5.5 * AutoMovieArchetypeUnits.INCH,
      mass: 41 * AutoMovieArchetypeUnits.OUNCE,
    },
  },
  flintlock: {
    lightDragoon: {
      length: 0.397,
      height: 0.14,
      width: 0.055,
      barrel: 9 * AutoMovieArchetypeUnits.INCH,
    },
    seaService: {
      length: 0.5,
      height: 0.18,
      width: 0.04,
      barrel: 12 * AutoMovieArchetypeUnits.INCH,
    },
  },
};

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { AutoMovieArchetypeRock } from "../nature/AutoMovieArchetypeRock";
import type { createProjectile } from "./createProjectile";

/** The British service musket ball, seen only in search results. */
const BALL: string =
  "British service musket ball, 14 to the pound, about .693 in; 184 excavated balls .66 to .72 in across (Warwick Beacon, Bullets fit for his gun, https://warwickonline.com/stories/bullets-fit-for-his-gun-ammunition-at-the-outbreak-of-the-revolution,250683), seen only in search results";

/** Two crossbow bolts, read in museum records. */
const BOLT: string =
  "Nationaal Militair Museum inv. 11461, bolt 360 mm, head 77 mm, shaft 13.6 mm across (https://collectie.nmm.nl/nl/collectie/detail/227252/); Metropolitan Museum 33754, steel and wood (oak, ash), bolt 43.7 cm, head 6.6 by 1.9 cm, 74 g (https://collectionapi.metmuseum.org/public/collection/v1/objects/33754)";

/**
 * War arrows, read in a bowyers' study that draws on the Mary Rose Trust's
 * records, their shafts' thickness at its upper end seen only in search
 * results.
 */
const ARROW: string =
  "Aston and Spencer, The Deane brother's Mary Rose Bow X1-3: Mary Rose arrows mostly 715 to 854 mm long, of aspen or poplar; the Westminster Abbey arrow 11 mm across at the shoulder and 50 g, Mary Rose arrow AZ472/19 62.5 g (https://keskustelu.primitiivijousi.fi/uploads/short-url/jbxr7WWexChfC3RBxRL26IK9gxF.pdf, pp. 27-29); Mary Rose shafts 12 to 13 mm at their thickest, seen only in search results";

/** The M67 grenade, read in its Army data sheet. */
const M67: string =
  "TM 43-0001-29 (1994), M67 fragmentation grenade: a 2.5 in steel sphere, 3.53 in long at most with its fuze, 14 oz, a 4 to 5 s fuze delay (https://dn760003.eu.archive.org/0/items/milmanual-tm-43-0001-29-army-ammunition-data-sheets-for-grenades/tm-43-0001-29_army_ammunition_data_sheets_for_grenades.pdf)";

/** The US musket cartridge, read in the Ordnance Manual's tables. */
const CARTRIDGE: string =
  'Ordnance Manual for the Use of the Officers of the United States Army, 3rd ed., 1862, p. 270, Cartridges for Small Arms, round ball, musket 1842: ball .65 in, 412 grs, powder 110 grs, "Weight of 10 cartridges" 13.2 oz, "Bundles of 10" 2.6 x 3.1 x 1.35 in, and p. 268, the bundling box\'s "length that of the cartridge" (https://archive.org/details/ordnancemanualfo00unitrich); Mordecai, Ordnance Manual, 1850, p. 246, the paper rolled on a former "of the same diameter as the ball" (https://archive.org/details/ordnancemanualf00mordgoog)';

/** The hand-thrown stone's mass, read. */
const STONE: string =
  'Wilson et al., Scientific Reports 6:30614 (2016), p. 5 (https://doi.org/10.1038/srep30614): the stone thrown farthest weighs "approximately 0.75 kg +/- 0.25 kg", the range 81.8 % of 55 spheroids chosen for throwing fell in';

/**
 * The band of each free dimension of {@link createProjectile} an object leaves,
 * by kind, with the sources they are read at: kept apart from the producer so
 * each file stays within its size. Read only as `createProjectile.BANDS`; an
 * arrow's and a bolt's provisional bands are drawn only for the object that
 * does not give the figure, a stone's specific gravity is granite's as
 * `createRock` reads it, and every band names its source.
 */
export const PROJECTILE_BANDS: Readonly<
  Record<
    createProjectile.Kind,
    Readonly<
      Partial<Record<createProjectile.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  ball: {
    diameter: AutoMovieArchetypeBand.metres(
      0.66 * AutoMovieArchetypeUnits.INCH,
      0.72 * AutoMovieArchetypeUnits.INCH,
      BALL,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      AutoMovieArchetypeUnits.POUND / 14,
      AutoMovieArchetypeUnits.POUND / 14,
      `${BALL}: a pound over fourteen`,
      true,
    ),
  },
  arrow: {
    length: AutoMovieArchetypeBand.metres(0.715, 0.854, ARROW),
    diameter: AutoMovieArchetypeBand.metres(
      0.011,
      0.013,
      `${ARROW}: AZ472/19's own not stated`,
      true,
    ),
  },
  bolt: {
    diameter: AutoMovieArchetypeBand.metres(
      0.0136,
      0.0136,
      `${BOLT}: Met 33754's shaft not stated; NMM 11461's, the one read`,
      true,
    ),
  },
  roundShot: {},
  grenade: {
    diameter: AutoMovieArchetypeBand.metres(
      2.5 * AutoMovieArchetypeUnits.INCH,
      2.5 * AutoMovieArchetypeUnits.INCH,
      M67,
    ),
    length: AutoMovieArchetypeBand.metres(
      3.53 * AutoMovieArchetypeUnits.INCH,
      3.53 * AutoMovieArchetypeUnits.INCH,
      M67,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      14 * AutoMovieArchetypeUnits.OUNCE,
      14 * AutoMovieArchetypeUnits.OUNCE,
      M67,
    ),
  },
  cartridge: {
    diameter: AutoMovieArchetypeBand.metres(
      0.65 * AutoMovieArchetypeUnits.INCH,
      0.65 * AutoMovieArchetypeUnits.INCH,
      `${CARTRIDGE}: the paper rolled on a former "of the same diameter as the ball", the ball .65 in; the paper's thickness, unread, not added`,
      true,
    ),
    length: AutoMovieArchetypeBand.metres(
      2.6 * AutoMovieArchetypeUnits.INCH,
      2.6 * AutoMovieArchetypeUnits.INCH,
      `${CARTRIDGE}: the bundle of ten 2.6 in long, the bundling box's "length that of the cartridge"`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      (13.2 * AutoMovieArchetypeUnits.OUNCE) / 10,
      (13.2 * AutoMovieArchetypeUnits.OUNCE) / 10,
      `${CARTRIDGE}: "Weight of 10 cartridges" 13.2 oz`,
    ),
  },
  stone: {
    mass: AutoMovieArchetypeBand.of("kg", 0.5, 1, STONE),
    gravity: AutoMovieArchetypeRock.BANDS.cobble.gravity,
  },
};

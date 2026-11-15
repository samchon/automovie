import {
  ArchetypeBand,
  ArchetypeCourse,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import type { createBow } from "./createBow";

/** The Mary Rose bow X1-3 and its approximations, read in the bowyers' study. */
const WARBOW: string =
  "Aston and Spencer, The Deane brother's Mary Rose Bow X1-3: the bow 1710 mm long, 42.03 mm wide and 29.79 mm deep at its centre, about 167 cm nock to nock once horned; approximation MR X1-9/S3 66 in nock to nock; approximations of wych elm, S1, S2 and S3 905, 868 and 785 g, drawing 108, 101 and 141 lb at 30 in; Mary Rose arrow nocks a median 3 mm wide (https://keskustelu.primitiivijousi.fi/uploads/short-url/jbxr7WWexChfC3RBxRL26IK9gxF.pdf, pp. 4-5, 13, 21-22, 25-26, 29, 32)";

/** Two Korean traditional horse bows, read at a dealer that states the maker's figures. */
const HORSE_BOW: string =
  'Freddie Warrior KTB 53 in: "Brace height: 5.5 to 6" (14 to 15 cm)", "Mass weight: 330 g", "Draw weight: 15 to 60 lbs in 5 lb steps, measured at 31" of draw" (https://www.bogentandler.at/en/freddie-warrior-ktb-53); Freddie Zenith KTB 48 in: brace 14 to 15 cm, 315 g, drawn at 31 in (https://www.bogentandler.at/en/freddie-zenith-ktb-48)';

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to a horse bow's and a recurve's grip, whose own size no maker read gives";

/** The draw weights shot at the 2012 Olympics. */
const KSL: string =
  'KSL International Archery, Arrow speeds recorded at the 2012 London Olympics: "Kathuna was shooting 49lbs on the fingers" at 59.7 m/s and "Luis was estimated to have ~54lbs on the fingers" at 62.2 m/s (https://www.kslinternationalarchery.com/Equipment/Arrow%20speed%202012%20Olympics.pdf); the upper weight is the table\'s estimate, and both are taken at the maker\'s 28" rating draw';

/** The crossbow read. */
const PAYNE: string =
  "Payne-Gallwey, The Crossbow (1903), Chapters III and XIX-XXXI (https://archive.org/details/Book_of_the_Crossbow_The_by_Sir_Ralph_Payne-Galloway)";

/** Grand Prix risers' masses, read at retailers. */
const RISERS: string =
  "Hoyt Grand Prix 25 in risers at retailers: Horizon about 1,133 g (Abbey Archery, https://abbeyarchery.com.au/p/HYRHZ/Hoyt+Grand+Prix+Horizon+Riser.html) to Arcos 2.95 lb, 1,338 g (Lancaster Archery, https://lancasterarchery.com/products/hoyt-grand-prix-arcos-25-recurve-riser); secondary, and the limbs' mass, which no read gives, is not counted";

/**
 * The band of each free dimension of {@link createBow} a kind's model and draw weight leave, by kind, with the sources they are read at: kept apart from the producer so each file stays within its size. Read only as `createBow.BANDS`; a recurve's brace is its model's (`createBow.BRACES`), and every band names its source, one not read at its primary source provisional.
 */
export const BOW_BANDS: Readonly<
  Record<
    createBow.Kind,
    Readonly<Partial<Record<createBow.Dimension, IArchetypeBand>>>
  >
> = {
  longbow: {
    length: ArchetypeBand.metres(1.67, 66 * ArchetypeUnits.INCH, WARBOW),
    depth: ArchetypeBand.metres(0.02979, 0.02979, WARBOW),
  },
  recurve: {
    depth: ArchetypeBand.metres(0.03, 0.04, POWER, true),
    draw: ArchetypeBand.of(
      "N",
      49 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY,
      54 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY,
      KSL,
      true,
    ),
    mass: ArchetypeBand.of("kg", 1.133, 1.338, RISERS, true),
  },
  horseBow: {
    depth: ArchetypeBand.metres(0.03, 0.04, POWER, true),
    brace: ArchetypeBand.metres(0.14, 0.15, HORSE_BOW),
  },
  crossbow: {
    length: ArchetypeBand.metres(
      30 * ArchetypeUnits.INCH,
      30 * ArchetypeUnits.INCH,
      `${PAYNE}: p. 101, the bow "Between extremes, 2 ft. 6 in."`,
    ),
    depth: ArchetypeBand.metres(
      1.5 * ArchetypeUnits.INCH,
      1.5 * ArchetypeUnits.INCH,
      `${PAYNE}: p. 93, the stock's "Thickness, 1½ in.", the fore-stock the bow hand takes`,
    ),
    brace: ArchetypeBand.metres(
      5 * ArchetypeUnits.INCH,
      5 * ArchetypeUnits.INCH,
      `${PAYNE}: p. 116, "the front of the string should be 5 in. from the inside upper edge of the centre of the bow"`,
    ),
    mass: ArchetypeBand.of(
      "kg",
      10 * ArchetypeUnits.POUND,
      12 * ArchetypeUnits.POUND,
      `${PAYNE}: p. 15, the sporting crossbow "from 10 lbs. to 12 lbs. if a cranequin"; Chapter XIX's crossbow, built here, is the sporting one, "of slightly larger size" in war`,
    ),
  },
};

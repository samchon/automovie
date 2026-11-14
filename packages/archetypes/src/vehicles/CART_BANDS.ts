import { HORSE_BANDS } from "../animals/HORSE_BANDS";
import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createCart } from "./createCart";

/** A shopping trolley, from its maker's page and a reseller's listing. */
const TROLLEY: string =
  "Wanzl EL series shopping trolleys (https://www.wanzl.com/en_DE/products/trolleys/shopping-trolleys/various-shopping-trolleys/el-series~p390); the EL 185's 610 x 1150 x 1030 mm from a reseller listing seen only in search results";

/** A wheelbarrow read at its maker's data sheet. */
const BARROW: string =
  "Matador M-130-L4 wheelbarrow data sheet (https://bati-avenue.com/media/akeneo_connector/media_files/1/0/10868_M_130_L4_EN_Data_sheet_final_1_f9d6.pdf)";

/** A length in inches, in metres. */
const inch = (value: number): number => value * 0.0254;

/** Single-horse two-wheeled driving carts read at their makers' and museums' pages. */
const INTRO: string =
  "Bennington Intro 2 Wheeler, the 14.2 to 15.2 hh size: wheels 94 cm, track 137 cm, 110 kg (https://www.benningtoncarriages.co.uk/carriages/starter-carriage/bennington-intro-2-wheeler)";

/** A multi-use cart for 14.2 to 16.3 hh horses, read at its seller's page. */
const MULTI: string =
  "a multi-use two-wheeled cart for 14.2 to 16.3 hh horses: wheels 43 in, 57 in hub to hub, shafts 89.5 and 93.5 in (https://www.gypsyhorses.com/sales/cart.htm)";

/** A museum gig. */
const GIG: string =
  "the Dennett gig, York Castle Museum: wheels 4 ft 5 in (https://www.thecarriagefoundation.org.uk/item/dennett-gig)";

/** Pulled rickshaws read at museum records and a period rule. */
const RICKSHAW: string =
  "the Powerhouse jinrikisha 245268, 1350 x 900 x 2150 mm (https://collection.powerhouse.com.au/object/245268); the Edo-Tokyo Museum rickshaws 89210382 (102 x 213 x 197 cm, wheels 108 cm) and 90360001 (183 x 107 x 198 cm) (https://www.edohakuarchives.jp/detail-103045.html, https://museumcollection.tokyo/en/works/6541188); the Hong Kong public rickshaw rules of 1882, wheels 3 ft 6 in, quoted from The China Mail at https://industrialhistoryhk.org/hong-kong-rickshaw-design/";

/** The six Tutankhamun chariots. */
const CHARIOT: string =
  "the six chariots from the tomb of Tutankhamun: J. Crouwel, 'Studying the Six Chariots from the Tomb of Tutankhamun - An Update', Chasing Chariots (Sidestone 2013), pp. 81-82 (https://www.sidestone.com/openaccess/9789088902093.pdf), and Carter's measurements, Griffith Institute TAA i.3.8.17 (https://tutankhamun.griffith.ox.ac.uk/scientific-notes/taa-i38-chariots/taa-i3817)";

/** The US field artillery limber of 1861. */
const LIMBER: string =
  "The Ordnance Manual for the Use of the Officers of the United States Army (1861), p. 74, the field carriages' table (https://archive.org/details/cu31924031187887/page/74)";

/** The US Army's six-mule wagon. */
const WAGON: string =
  "Specifications for Six-Mule United States Army Wagon (Covered), Quartermaster's Department, Specifications for Means of Transportation (1882), pp. 1-7 (https://archive.org/details/specificationsf02deptgoog/page/n13)";

/** Broughams read at museum records. */
const BROUGHAM: string =
  "the Brewster brougham of 1893 (H 78.5 in, W 68 in, L 145.5 in, wheelbase 91.5 in, wheels 36.5 and 48.25 in) and the Miner, Stevens brougham of 1840-1860 (H 79 in, W 69 in, L 153 in, wheels 42 and 50 in, wheelbase 105 in) at The Henry Ford (https://www.thehenryford.org/collections/explore/artifact/33937, https://www.thehenryford.org/collections/explore/artifact/7881), and the Peters bow-fronted double brougham of 1880 at York Castle Museum (H 6 ft 2 in, L 11 ft 7 in, W 5 ft 5 in, wheels 3 ft and 3 ft 8 in) (https://thecarriagefoundation.org.uk/item/bow-fronted-double-brougham)";

/** The ANSUR II wrist centres, as the human package derives them. */
const WRIST: string =
  "the wrist centre's height above the floor, ANSUR II stylion height less 1.5 mm: women's mean 793 mm, men's 846 mm (packages/human/docs/anatomy/skeleton.md, after the ANSUR II working databases)";

/**
 * The band of each free dimension of a cart, by kind, with the source it was read at; `createCart.BANDS` is this table. A drawn vehicle sized for a horse draws the horse's withers height and girth from the saddle horse's own bands, so the cart fits the horse `createHorse` builds.
 */
export const CART_BANDS: Readonly<
  Record<
    createCart.Kind,
    Readonly<Partial<Record<createCart.Dimension, IArchetypeBand>>>
  >
> = {
  trolley: {
    length: ArchetypeBand.metres(1.15, 1.15, TROLLEY, true),
    width: ArchetypeBand.metres(0.61, 0.61, TROLLEY, true),
    handleHeight: ArchetypeBand.metres(
      0.89,
      1.03,
      `the 35 and 37 in middle push hand heights of the Liberty Mutual tables after Snook and Ciriello 1991 (https://www.gorbel.com/resources/blog/LibertyMutualTables manual materials handling guidelines.pdf) up to the trolley's 1030 mm height (${TROLLEY})`,
      true,
    ),
    handleSpacing: ArchetypeBand.metres(0.61, 0.61, TROLLEY, true),
    gripDiameter: ArchetypeBand.metres(
      0.025,
      0.032,
      "the trolley's handle is a round tube whose diameter its maker does not state; an estimate",
      true,
    ),
    wheelDiameter: ArchetypeBand.metres(
      0.1,
      0.125,
      `${TROLLEY}: castors of 100 or 125 mm`,
    ),
    mass: ArchetypeBand.of("kg", 18, 28, ArchetypeBand.TYPICAL_MASS, true),
  },
  wheelbarrow: {
    length: ArchetypeBand.metres(1.45, 1.45, BARROW),
    width: ArchetypeBand.metres(0.59, 0.59, BARROW),
    handleHeight: ArchetypeBand.metres(
      0.62,
      0.645,
      `${BARROW}: 620 mm overall height; 645 mm handle height of another model, seen only in search results`,
      true,
    ),
    handleSpacing: ArchetypeBand.metres(
      0.59,
      0.595,
      `${BARROW}: 590 mm overall width; 595 mm handle spacing of another model, seen only in search results`,
      true,
    ),
    gripDiameter: ArchetypeBand.metres(
      0.038,
      0.038,
      `${BARROW}: handgrip 38 mm, the column's label being ambiguous`,
      true,
    ),
    wheelDiameter: ArchetypeBand.metres(0.4, 0.4, BARROW),
    mass: ArchetypeBand.of("kg", 18.6, 18.6, BARROW),
  },
  cart: {
    wheelDiameter: ArchetypeBand.metres(
      0.94,
      inch(53),
      `${INTRO}; ${MULTI}; ${GIG}`,
    ),
    track: ArchetypeBand.metres(1.37, inch(57), `${INTRO}; ${MULTI}`),
    shaftLength: ArchetypeBand.metres(
      inch(89.5),
      inch(93.5),
      `${MULTI}, how the seller measured not stated; read as IVC Carriage's harness measuring chart defines a shaft's length, tip to single tree in a straight line (https://cdn.shopify.com/s/files/1/0046/6819/4886/files/IVC_Harness_Fitting_Diagram_Electronic.pdf)`,
    ),
    seatHeight: ArchetypeBand.metres(
      inch(51),
      inch(51),
      "a used Bennington two-wheeler's 51 in seat height, seen only in search results (the listing's page no longer answers)",
      true,
    ),
    withersHeight: HORSE_BANDS.withersHeight,
    girth: HORSE_BANDS.girth,
    mass: ArchetypeBand.of("kg", 110, 110, INTRO),
  },
  rickshaw: {
    wheelDiameter: ArchetypeBand.metres(inch(42), 1.08, RICKSHAW),
    width: ArchetypeBand.metres(0.9, 1.07, RICKSHAW),
    length: ArchetypeBand.metres(
      2.13,
      2.15,
      `${RICKSHAW}; the two longest of the records' unlabelled sizes taken as the length`,
    ),
    gripHeight: ArchetypeBand.metres(0.793, 0.846, WRIST),
    mass: ArchetypeBand.of("kg", 40, 60, ArchetypeBand.TYPICAL_MASS, true),
  },
  chariot: {
    wheelDiameter: ArchetypeBand.metres(0.9, 0.97, CHARIOT),
    track: ArchetypeBand.metres(1.57, 1.8, CHARIOT),
    floorWidth: ArchetypeBand.metres(0.92, 1.11, CHARIOT),
    floorDepth: ArchetypeBand.metres(0.39, 0.54, CHARIOT),
    railHeight: ArchetypeBand.metres(
      0.71,
      0.78,
      `${CHARIOT}: Carter's greatest heights of the body, taken from the floor`,
    ),
    poleLength: ArchetypeBand.metres(2.43, 2.6, CHARIOT),
    withersHeight: HORSE_BANDS.withersHeight,
    mass: ArchetypeBand.of(
      "kg",
      24,
      30,
      "the Florence chariot's 24 kg (Decker 1986) and its Hildesheim replica's under 30 kg, H. Koepp-Junk in Chasing Chariots (Sidestone 2013) (https://www.sidestone.com/openaccess/9789088902093.pdf)",
    ),
  },
  limber: {
    wheelDiameter: ArchetypeBand.metres(
      inch(57),
      inch(57),
      `${LIMBER}: height of wheel 57 in, every field carriage's`,
    ),
    track: ArchetypeBand.metres(inch(60), inch(60), `${LIMBER}: track 60 in`),
    length: ArchetypeBand.metres(
      inch(52.85),
      inch(52.85),
      `${LIMBER}: the limber's length without wheels or pole, 52.85 in`,
    ),
    poleLength: ArchetypeBand.metres(
      inch(161.2 - 52.85),
      inch(161.2 - 52.85),
      `${LIMBER}: the pole beyond the frame, the limber's 161.2 in without wheels less its 52.85 in without wheels or pole`,
    ),
    mass: ArchetypeBand.of(
      "kg",
      860 * 0.45359237,
      860 * 0.45359237,
      `${LIMBER}: the limber complete without implements, 860 lb`,
    ),
  },
  wagon: {
    frontWheelDiameter: ArchetypeBand.metres(
      inch(46),
      inch(46),
      `${WAGON}: front wheels 3 ft 10 in high`,
    ),
    wheelDiameter: ArchetypeBand.metres(
      inch(58),
      inch(58),
      `${WAGON}: hind wheels 4 ft 10 in high`,
    ),
    track: ArchetypeBand.metres(
      inch(60),
      inch(60),
      `${WAGON}: to track 5 ft from centre to centre of the wheels`,
    ),
    wheelbase: ArchetypeBand.metres(
      inch(73),
      inch(73),
      `${WAGON}: the centre of the king-bolt hole to the centre of the back axle-tree, 6 ft 1 in, the king-bolt standing over the front axle`,
    ),
    poleLength: ArchetypeBand.metres(
      inch(128),
      inch(128),
      `${WAGON}: the tongue, 10 ft 8 in long`,
    ),
    length: ArchetypeBand.metres(
      inch(120),
      inch(120),
      `${WAGON}: the body 10 ft long at the bottom, inside`,
    ),
    width: ArchetypeBand.metres(
      inch(42),
      inch(42),
      `${WAGON}: the body 3 ft 6 in wide, inside`,
    ),
    bedDepth: ArchetypeBand.metres(
      inch(24),
      inch(24),
      `${WAGON}: the body 2 ft deep, inside`,
    ),
    mass: ArchetypeBand.of(
      "kg",
      1950 * 0.45359237,
      1950 * 0.45359237,
      `${WAGON}: weight of wagon about 1,950 pounds`,
    ),
  },
  carriage: {
    frontWheelDiameter: ArchetypeBand.metres(inch(36), inch(42), BROUGHAM),
    wheelDiameter: ArchetypeBand.metres(inch(44), inch(50), BROUGHAM),
    wheelbase: ArchetypeBand.metres(inch(91.5), inch(105), BROUGHAM),
    length: ArchetypeBand.metres(inch(139), inch(153), BROUGHAM),
    width: ArchetypeBand.metres(inch(65), inch(69), BROUGHAM),
    height: ArchetypeBand.metres(inch(74), inch(79), BROUGHAM),
    mass: ArchetypeBand.of("kg", 400, 600, ArchetypeBand.TYPICAL_MASS, true),
  },
};

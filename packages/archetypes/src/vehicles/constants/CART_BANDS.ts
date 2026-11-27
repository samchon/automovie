import { HORSE_BANDS } from "../../animals/equine/HORSE_BANDS";
import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { CART_MODELS } from "./CART_MODELS";
import type { AutoMovieArchetypeCart } from "../AutoMovieArchetypeCart";

/*
 * A shopping trolley, from its maker's page and a reseller's listing.
 */
const TROLLEY: string =
  "Wanzl EL series shopping trolleys (https://www.wanzl.com/en_DE/products/trolleys/shopping-trolleys/various-shopping-trolleys/el-series~p390); the EL 185's 610 x 1150 x 1030 mm from a reseller listing seen only in search results";

/*
 * A wheelbarrow read at its maker's data sheet.
 */
const BARROW: string =
  "Matador M-130-L4 wheelbarrow data sheet (https://bati-avenue.com/media/akeneo_connector/media_files/1/0/10868_M_130_L4_EN_Data_sheet_final_1_f9d6.pdf)";

/*
 * A single-horse two-wheeled driving cart read at its maker's page.
 */
const INTRO: string =
  "Bennington Intro 2 Wheeler, the 14.2 to 15.2 hh size: wheels 94 cm, track 137 cm, 110 kg (https://www.benningtoncarriages.co.uk/carriages/starter-carriage/bennington-intro-2-wheeler)";

/*
 * A multi-use cart for 14.2 to 16.3 hh horses, read at its seller's page.
 */
const MULTI: string =
  "a multi-use two-wheeled cart for 14.2 to 16.3 hh horses: wheels 43 in, 57 in hub to hub, shafts 89.5 and 93.5 in (https://www.gypsyhorses.com/sales/cart.htm)";

/*
 * Pulled rickshaws read at museum records and a period rule.
 */
const RICKSHAW: string =
  "the Powerhouse jinrikisha 245268, 1350 x 900 x 2150 mm (https://collection.powerhouse.com.au/object/245268); the Edo-Tokyo Museum rickshaws 89210382 (102 x 213 x 197 cm, wheels 108 cm) and 90360001 (183 x 107 x 198 cm) (https://www.edohakuarchives.jp/detail-103045.html, https://museumcollection.tokyo/en/works/6541188); the Hong Kong public rickshaw rules of 1882, wheels 3 ft 6 in, quoted from The China Mail at https://industrialhistoryhk.org/hong-kong-rickshaw-design/";

/*
 * The six Tutankhamun chariots.
 */
const CHARIOT: string =
  "the six chariots from the tomb of Tutankhamun: J. Crouwel, 'Studying the Six Chariots from the Tomb of Tutankhamun - An Update', Chasing Chariots (Sidestone 2013), pp. 81-82 (https://www.sidestone.com/openaccess/9789088902093.pdf), and Carter's measurements, Griffith Institute TAA i.3.8.17 (https://tutankhamun.griffith.ox.ac.uk/scientific-notes/taa-i38-chariots/taa-i3817)";

/*
 * The US field artillery limber of 1861.
 */
const LIMBER: string =
  "The Ordnance Manual for the Use of the Officers of the United States Army (1861), p. 74, the field carriages' table (https://archive.org/details/cu31924031187887/page/74)";

/*
 * The US Army's six-mule wagon.
 */
const WAGON: string =
  "Specifications for Six-Mule United States Army Wagon (Covered), Quartermaster's Department, Specifications for Means of Transportation (1882), pp. 1-7 (https://archive.org/details/specificationsf02deptgoog/page/n13)";

/*
 * Broughams read at museum records.
 */
const BROUGHAM: string =
  "the Brewster brougham of 1893 (H 78.5 in, W 68 in, L 145.5 in, wheelbase 91.5 in, wheels 36.5 and 48.25 in) and the Miner, Stevens brougham of 1840-1860 (H 79 in, W 69 in, L 153 in, wheels 42 and 50 in, wheelbase 105 in) at The Henry Ford (https://www.thehenryford.org/collections/explore/artifact/33937, https://www.thehenryford.org/collections/explore/artifact/7881), and the Peters bow-fronted double brougham of 1880 at York Castle Museum (H 6 ft 2 in, L 11 ft 7 in, W 5 ft 5 in, wheels 3 ft and 3 ft 8 in) (https://thecarriagefoundation.org.uk/item/bow-fronted-double-brougham)";

/*
 * The read models' figures of one dimension, for a band a model without that
 * figure borrows from the models with it.
 * Parameter kind: The kind.
 * Parameter dimension: The dimension.
 * Returns: The least and the greatest read figure.
 */
function spread(
  kind: AutoMovieArchetypeCart.Kind,
  dimension: AutoMovieArchetypeCart.Dimension,
): [number, number] {
  const figures: number[] = Object.values(CART_MODELS.figures[kind] ?? {})
    .map(
      (
        model:
          | Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>
          | undefined,
      ): number | undefined => model?.[dimension],
    )
    .filter(
      (figure: number | undefined): figure is number => figure !== undefined,
    );
  return [Math.min(...figures), Math.max(...figures)];
}

/*
 * The ANSUR II wrist centres, as the human package derives them.
 */
const WRIST: string =
  "the wrist centre's height above the floor, ANSUR II stylion height less 1.5 mm: women's mean 793 mm, men's 846 mm (packages/human/docs/anatomy/skeleton.md, after the ANSUR II working databases)";

/*
 * The band of each free dimension of a cart, by kind, with the source it was
 * read at, a read model's own figures being `CART_MODELS`'s and not bands;
 * `createCart.BANDS` is this table. A drawn vehicle sized for a horse draws the
 * horse's withers height from the saddle horse's own band, and a cart takes the
 * girth that height gives the horse (`createCart`), so the cart fits the horse
 * `createHorse` builds.
 */
export const CART_BANDS: Readonly<
  Record<
    AutoMovieArchetypeCart.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  trolley: {
    length: AutoMovieArchetypeBand.metres(1.15, 1.15, TROLLEY, true),
    width: AutoMovieArchetypeBand.metres(0.61, 0.61, TROLLEY, true),
    handleHeight: AutoMovieArchetypeBand.metres(
      35 * AutoMovieArchetypeUnits.INCH,
      1.03,
      `the 35 and 37 in middle push hand heights of the Liberty Mutual tables after Snook and Ciriello 1991 (https://www.gorbel.com/resources/blog/LibertyMutualTables manual materials handling guidelines.pdf) up to the trolley's 1030 mm height (${TROLLEY})`,
      true,
    ),
    handleSpacing: AutoMovieArchetypeBand.metres(0.61, 0.61, TROLLEY, true),
    gripDiameter: AutoMovieArchetypeBand.metres(
      0.025,
      0.032,
      "the trolley's handle is a round tube whose diameter its maker does not state; an estimate",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      18,
      28,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  wheelbarrow: {
    length: AutoMovieArchetypeBand.metres(1.45, 1.45, BARROW),
    width: AutoMovieArchetypeBand.metres(0.59, 0.59, BARROW),
    handleHeight: AutoMovieArchetypeBand.metres(
      0.62,
      0.645,
      `${BARROW}: 620 mm overall height; 645 mm handle height of another model, seen only in search results`,
      true,
    ),
    handleSpacing: AutoMovieArchetypeBand.metres(
      0.59,
      0.595,
      `${BARROW}: 590 mm overall width; 595 mm handle spacing of another model, seen only in search results`,
      true,
    ),
    gripDiameter: AutoMovieArchetypeBand.metres(
      0.038,
      0.038,
      `${BARROW}: handgrip 38 mm, the column's label being ambiguous`,
      true,
    ),
    wheelDiameter: AutoMovieArchetypeBand.metres(0.4, 0.4, BARROW),
    mass: AutoMovieArchetypeBand.of("kg", 18.6, 18.6, BARROW),
  },
  cart: {
    track: AutoMovieArchetypeBand.metres(
      1.37,
      spread("cart", "track")[1],
      `${INTRO}; ${MULTI}: the read tracks, borrowed by the gig, whose page gives none and whose track no law gives from its wheels (searched: the Carriage Foundation's record)`,
      true,
    ),
    clearance: AutoMovieArchetypeBand.metres(
      8 * AutoMovieArchetypeUnits.INCH,
      20 * AutoMovieArchetypeUnits.INCH,
      'IVC Carriage, Types of Horse Carriage Shafts: "there should be 8-20" of clearance from the horse to the closest part of the vehicle" (https://www.ivccarriage.com/blogs/ivc-carriage/types-of-horse-carriage-shafts)',
    ),
    seatHeight: AutoMovieArchetypeBand.metres(
      51 * AutoMovieArchetypeUnits.INCH,
      51 * AutoMovieArchetypeUnits.INCH,
      "a used Bennington two-wheeler's 51 in seat height, seen only in search results (the listing's page no longer answers)",
      true,
    ),
    withersHeight: HORSE_BANDS.withersHeight,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      90,
      110,
      "the Bennington Intro 2 Wheeler's three sizes, 90, 98 and 110 kg (https://www.benningtoncarriages.co.uk/carriages/starter-carriage/bennington-intro-2-wheeler), borrowed by the multi-use cart and the gig, whose pages give no mass; no law gives a cart's mass from its read figures, its coarse parts' volume overstating its timber and its planks' thicknesses unread",
      true,
    ),
  },
  rickshaw: {
    wheelDiameter: AutoMovieArchetypeBand.metres(
      42 * AutoMovieArchetypeUnits.INCH,
      spread("rickshaw", "wheelDiameter")[1],
      `${RICKSHAW}: the 1882 rule's and the Edo rickshaw's wheels, borrowed by the records that give none`,
      true,
    ),
    gripHeight: AutoMovieArchetypeBand.metres(0.793, 0.846, WRIST),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      40,
      60,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  chariot: {
    wheelDiameter: AutoMovieArchetypeBand.metres(0.9, 0.97, CHARIOT),
    track: AutoMovieArchetypeBand.metres(1.57, 1.8, CHARIOT),
    floorWidth: AutoMovieArchetypeBand.metres(0.92, 1.11, CHARIOT),
    floorDepth: AutoMovieArchetypeBand.metres(0.39, 0.54, CHARIOT),
    railHeight: AutoMovieArchetypeBand.metres(
      ...spread("chariot", "railHeight"),
      `${CHARIOT}: Carter's greatest heights of the body, taken from the floor, borrowed by the chariots whose rows give none`,
      true,
    ),
    poleLength: AutoMovieArchetypeBand.metres(2.43, 2.6, CHARIOT),
    withersHeight: HORSE_BANDS.withersHeight,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      24,
      30,
      "the Florence chariot's 24 kg (Decker 1986) and its Hildesheim replica's under 30 kg, H. Koepp-Junk in Chasing Chariots (Sidestone 2013) (https://www.sidestone.com/openaccess/9789088902093.pdf)",
    ),
  },
  limber: {
    wheelDiameter: AutoMovieArchetypeBand.metres(
      57 * AutoMovieArchetypeUnits.INCH,
      57 * AutoMovieArchetypeUnits.INCH,
      `${LIMBER}: height of wheel 57 in, every field carriage's`,
    ),
    track: AutoMovieArchetypeBand.metres(
      60 * AutoMovieArchetypeUnits.INCH,
      60 * AutoMovieArchetypeUnits.INCH,
      `${LIMBER}: track 60 in`,
    ),
    length: AutoMovieArchetypeBand.metres(
      52.85 * AutoMovieArchetypeUnits.INCH,
      52.85 * AutoMovieArchetypeUnits.INCH,
      `${LIMBER}: the limber's length without wheels or pole, 52.85 in`,
    ),
    poleLength: AutoMovieArchetypeBand.metres(
      (161.2 - 52.85) * AutoMovieArchetypeUnits.INCH,
      (161.2 - 52.85) * AutoMovieArchetypeUnits.INCH,
      `${LIMBER}: the pole beyond the frame, the limber's 161.2 in without wheels less its 52.85 in without wheels or pole`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      860 * AutoMovieArchetypeUnits.POUND,
      860 * AutoMovieArchetypeUnits.POUND,
      `${LIMBER}: the limber complete without implements, 860 lb`,
    ),
  },
  wagon: {
    frontWheelDiameter: AutoMovieArchetypeBand.metres(
      46 * AutoMovieArchetypeUnits.INCH,
      46 * AutoMovieArchetypeUnits.INCH,
      `${WAGON}: front wheels 3 ft 10 in high`,
    ),
    wheelDiameter: AutoMovieArchetypeBand.metres(
      58 * AutoMovieArchetypeUnits.INCH,
      58 * AutoMovieArchetypeUnits.INCH,
      `${WAGON}: hind wheels 4 ft 10 in high`,
    ),
    track: AutoMovieArchetypeBand.metres(
      60 * AutoMovieArchetypeUnits.INCH,
      60 * AutoMovieArchetypeUnits.INCH,
      `${WAGON}: to track 5 ft from centre to centre of the wheels`,
    ),
    wheelbase: AutoMovieArchetypeBand.metres(
      73 * AutoMovieArchetypeUnits.INCH,
      73 * AutoMovieArchetypeUnits.INCH,
      `${WAGON}: the centre of the king-bolt hole to the centre of the back axle-tree, 6 ft 1 in, the king-bolt standing over the front axle`,
    ),
    poleLength: AutoMovieArchetypeBand.metres(
      128 * AutoMovieArchetypeUnits.INCH,
      128 * AutoMovieArchetypeUnits.INCH,
      `${WAGON}: the tongue, 10 ft 8 in long`,
    ),
    length: AutoMovieArchetypeBand.metres(
      120 * AutoMovieArchetypeUnits.INCH,
      120 * AutoMovieArchetypeUnits.INCH,
      `${WAGON}: the body 10 ft long at the bottom, inside`,
    ),
    width: AutoMovieArchetypeBand.metres(
      42 * AutoMovieArchetypeUnits.INCH,
      42 * AutoMovieArchetypeUnits.INCH,
      `${WAGON}: the body 3 ft 6 in wide, inside`,
    ),
    bedDepth: AutoMovieArchetypeBand.metres(
      24 * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      `${WAGON}: the body 2 ft deep, inside`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1950 * AutoMovieArchetypeUnits.POUND,
      1950 * AutoMovieArchetypeUnits.POUND,
      `${WAGON}: weight of wagon about 1,950 pounds`,
    ),
  },
  carriage: {
    wheelbase: AutoMovieArchetypeBand.metres(
      ...spread("carriage", "wheelbase"),
      `${BROUGHAM}: the two read wheelbases, borrowed by the Peters brougham, whose record gives none`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      400,
      600,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
};

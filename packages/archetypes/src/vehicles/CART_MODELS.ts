import { HORSE_BANDS } from "../animals/HORSE_BANDS";
import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createCart } from "./createCart";

/** One read model's or option's figures by dimension. */
type Figures = Readonly<Partial<Record<createCart.Dimension, number>>>;

/** Inches. */
const IN: number = AutoMovieArchetypeUnits.INCH;

/** Centimetres. */
const CM: number = AutoMovieArchetypeUnits.CENTIMETRE;

/**
 * The read carriers by kind, each whole, with the options picked on their own
 * axes and the range of horses a cart is made for.
 *
 * - A trolley's castors: Wanzl's EL series rolls on "castor wheels with 100 or
 *   125 mm diameters", not tied to a model, so the castor is its own axis.
 * - A horse's two-wheeled cart: the multi-use cart for 14.2 to 16.3 hh horses, 43
 *   in wheels set 57 in apart hub to hub, its shafts 89.5 or 93.5 in, the
 *   shafts its own axis (https://www.gypsyhorses.com/sales/cart.htm); and the
 *   Dennett gig at York Castle Museum, wheels 4 ft 5 in, its horse not stated
 *   (https://www.thecarriagefoundation.org.uk/item/dennett-gig). A cart made
 *   for a stated range of horses draws its horse's withers height inside that
 *   range where it meets the horse's own band (`ranges`), and with the withers
 *   height fixed only the carts made for it are picked.
 * - A rickshaw: the Edo-Tokyo Museum's 89210382 (102 x 213 x 197 cm, wheels 108
 *   cm; https://www.edohakuarchives.jp/detail-103045.html) and 90360001 (183 x
 *   107 x 198 cm; https://museumcollection.tokyo/en/works/6541188), and the
 *   Powerhouse's 245268 (1350 x 900 x 2150 mm;
 *   https://collection.powerhouse.com.au/object/245268), the longest unlabelled
 *   size taken as the length and the width as the side-to-side one.
 * - A chariot: Carter's six from the tomb of Tutankhamun, Griffith Institute TAA
 *   i.3.8.17
 *   (https://tutankhamun.griffith.ox.ac.uk/scientific-notes/taa-i38-chariots/taa-i3817):
 *   the body's greatest width and height, the floor's depth, the pole and the
 *   wheels. The notes' rows leave cells blank and the transcription collapses
 *   them, so where a row has a gap the column of each later figure is inferred
 *   from its position: the pole of 121, 161 and 332, and 333's wheel, are
 *   inferred. A figure a row lacks is drawn from Crouwel's stated ranges over
 *   the six (`CART_BANDS`).
 * - A carriage: the Brewster brougham of 1893 (H 78.5 in, W 68, L 145.5,
 *   wheelbase 91.5, wheels 36.5 and 48.25 in) and the Miner, Stevens brougham
 *   of 1840-1860 (H 79, W 69, L 153, wheelbase 105, wheels 42 and 50 in) at The
 *   Henry Ford
 *   (https://www.thehenryford.org/collections/explore/artifact/33937,
 *   https://www.thehenryford.org/collections/explore/artifact/7881), and the
 *   Peters bow-fronted double brougham of 1880 at York Castle Museum (H 6 ft 2
 *   in, L 11 ft 7 in, W 5 ft 5 in, wheels 3 ft and 3 ft 8 in;
 *   https://thecarriagefoundation.org.uk/item/bow-fronted-double-brougham); the
 *   smaller wheel is taken as the front.
 */
export const CART_MODELS: Readonly<{
  figures: Readonly<
    Partial<
      Record<
        createCart.Kind,
        Readonly<Partial<Record<createCart.Model, Figures>>>
      >
    >
  >;
  castors: Readonly<
    Partial<
      Record<
        createCart.Kind,
        Readonly<Partial<Record<createCart.Castor, Figures>>>
      >
    >
  >;
  shafts: Readonly<
    Partial<
      Record<
        createCart.Model,
        Readonly<Partial<Record<createCart.Shaft, Figures>>>
      >
    >
  >;
  ranges: Readonly<
    Partial<
      Record<
        createCart.Model,
        Readonly<Partial<Record<createCart.Dimension, IAutoMovieArchetypeBand>>>
      >
    >
  >;
}> = {
  figures: {
    cart: {
      multiUse: { wheelDiameter: 43 * IN, track: 57 * IN },
      dennettGig: { wheelDiameter: 53 * IN },
    },
    rickshaw: {
      edo89210382: {
        length: 213 * CM,
        width: 102 * CM,
        wheelDiameter: 108 * CM,
      },
      edo90360001: { length: 198 * CM, width: 107 * CM },
      powerhouse245268: { length: 2.15, width: 0.9 },
    },
    chariot: {
      carter120: {
        floorWidth: 105 * CM,
        railHeight: 78 * CM,
        floorDepth: 46 * CM,
        wheelDiameter: 93 * CM,
      },
      carter121: {
        floorWidth: 100 * CM,
        poleLength: 243 * CM,
        wheelDiameter: 94 * CM,
      },
      carter122: {
        floorWidth: 102 * CM,
        railHeight: 75 * CM,
        floorDepth: 44 * CM,
        poleLength: 256 * CM,
        wheelDiameter: 92 * CM,
      },
      carter161: {
        floorWidth: 107 * CM,
        railHeight: 71 * CM,
        floorDepth: 50 * CM,
        poleLength: 250 * CM,
        wheelDiameter: 97 * CM,
      },
      carter332: { poleLength: 260 * CM, wheelDiameter: 84 * CM },
      carter333: {
        floorWidth: 96 * CM,
        floorDepth: 38.5 * CM,
        wheelDiameter: 80 * CM,
      },
    },
    carriage: {
      brewster: {
        height: 78.5 * IN,
        width: 68 * IN,
        length: 145.5 * IN,
        wheelbase: 91.5 * IN,
        frontWheelDiameter: 36.5 * IN,
        wheelDiameter: 48.25 * IN,
      },
      minerStevens: {
        height: 79 * IN,
        width: 69 * IN,
        length: 153 * IN,
        wheelbase: 105 * IN,
        frontWheelDiameter: 42 * IN,
        wheelDiameter: 50 * IN,
      },
      peters: {
        height: 74 * IN,
        width: 65 * IN,
        length: 139 * IN,
        frontWheelDiameter: 36 * IN,
        wheelDiameter: 44 * IN,
      },
    },
  },
  castors: {
    trolley: {
      mm100: { wheelDiameter: 0.1 },
      mm125: { wheelDiameter: 0.125 },
    },
  },
  shafts: {
    multiUse: {
      in89: { shaftLength: 89.5 * IN },
      in93: { shaftLength: 93.5 * IN },
    },
  },
  ranges: {
    multiUse: {
      withersHeight: AutoMovieArchetypeBand.metres(
        Math.max(HORSE_BANDS.withersHeight.minimum, 58 * IN),
        Math.min(HORSE_BANDS.withersHeight.maximum, 67 * IN),
        `the multi-use cart's 14.2 to 16.3 hh horses, 58 to 67 in at four inches to the hand (https://www.gypsyhorses.com/sales/cart.htm) inside the horse's own band (${HORSE_BANDS.withersHeight.source})`,
      ),
    },
  },
};

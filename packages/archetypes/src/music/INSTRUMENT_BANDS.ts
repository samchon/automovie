import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createInstrument } from "./createInstrument";

/** The upright piano, from a search only. */
const U1: string =
  "Yamaha U1 upright piano, 121 cm high, 153 cm wide, 61 to 62 cm deep, 228 kg, as search results give Yamaha's regional specification pages; not read";

/** The keyboard, from a search only. */
const KEYS: string =
  "a modern piano keyboard's octave of 164 to 165 mm, white keys about 150 mm long and black keys about 95 mm, as search results give the Wikipedia article Musical keyboard and makers' listings; not read";

/** Key-top heights, from a search only. */
const KEYTOP: string =
  "upright key tops 28 to 30 1/2 in above the floor, owners' measurements as search results give them; no maker's figure read";

/** The guitar read. */
const D28: string =
  "Martin D-28: 25.4 in scale, 1 3/4 in nut, string spacing at the saddle 2 5/32 in, 20 frets, the neck joining at the 14th (https://www.martinguitar.com/guitars/standard-series/d-28/)";

/** The guitar's body, from a search only. */
const D28_BODY: string =
  "Martin D-28 body about 20 in long, 15 5/8 in wide and 4 7/8 in deep, weighing 4 lb 4 oz to 4 lb 12 oz, as search results give guitarchalk.com and retailers' listings; not read";

/** The violin read. */
const VIOLIN: string =
  "GEWA L'Apprenti VL2 4/4 violin: back 355 mm, string length 327 mm, bouts 168, 116 and 206 mm, neck 138 mm (https://paytonviolins.com/shop/vn4061-gewa-violin-l-apprenti-vl2-4-4-11490)";

/** The bow, from a search only. */
const BOW: string =
  "4/4 violin bows of about 74 to 75 cm and 58 to 65 g, as search results give Soundhouse's guide and makers' listings; not read";

/** The drum read. */
const SONOR: string =
  "Sonor MP 1412 X parade snare drum, 14 x 12 in, 6.0 kg (https://www.sonor.com/marching/instruments/products/mp-1412-x)";

/** The bugle, from a search only. */
const BUGLE: string =
  "G bugles 14 1/2 to 15 in long with bells of 107 to 126 mm, about 680 g, as search results give museum records (emuseum.nmmusd.org) and retailers' listings; not read";

/**
 * The band of each free dimension of {@link createInstrument}, by kind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds; each band names its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension per kind, keyed by the producer's closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Kept beside the producer so the producer stays one readable construction; it re-exports as `createInstrument.BANDS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A band read only in search results is provisional as a whole; a scale or a nut the maker states is fixed at it.
 */
export const INSTRUMENT_BANDS: Readonly<
  Record<
    createInstrument.Kind,
    Readonly<Partial<Record<createInstrument.Dimension, IArchetypeBand>>>
  >
> = {
  uprightPiano: {
    height: ArchetypeBand.metres(1.21, 1.21, U1, true),
    width: ArchetypeBand.metres(1.53, 1.53, U1, true),
    depth: ArchetypeBand.metres(0.61, 0.62, U1, true),
    keyHeight: ArchetypeBand.metres(0.711, 0.775, KEYTOP, true),
    octave: ArchetypeBand.metres(0.164, 0.165, KEYS, true),
    keyLength: ArchetypeBand.metres(0.15, 0.15, KEYS, true),
    blackLength: ArchetypeBand.metres(0.095, 0.095, KEYS, true),
    mass: ArchetypeBand.of("kg", 228, 228, U1, true),
  },
  guitar: {
    scale: ArchetypeBand.metres(0.64516, 0.64516, D28),
    nut: ArchetypeBand.metres(0.04445, 0.04445, D28),
    saddle: ArchetypeBand.metres(0.05476, 0.05476, D28),
    bodyLength: ArchetypeBand.metres(0.508, 0.508, D28_BODY, true),
    bodyWidth: ArchetypeBand.metres(0.397, 0.397, D28_BODY, true),
    bodyDepth: ArchetypeBand.metres(0.124, 0.124, D28_BODY, true),
    mass: ArchetypeBand.of("kg", 1.93, 2.15, D28_BODY, true),
  },
  violin: {
    bodyLength: ArchetypeBand.metres(0.355, 0.355, VIOLIN),
    scale: ArchetypeBand.metres(0.327, 0.327, VIOLIN),
    neck: ArchetypeBand.metres(0.138, 0.138, VIOLIN),
    upperBout: ArchetypeBand.metres(0.168, 0.168, VIOLIN),
    waist: ArchetypeBand.metres(0.116, 0.116, VIOLIN),
    lowerBout: ArchetypeBand.metres(0.206, 0.206, VIOLIN),
    mass: ArchetypeBand.of(
      "kg",
      0.4,
      0.5,
      ArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  violinBow: {
    length: ArchetypeBand.metres(0.74, 0.75, BOW, true),
    mass: ArchetypeBand.of("kg", 0.058, 0.065, BOW, true),
  },
  sideDrum: {
    diameter: ArchetypeBand.metres(0.3556, 0.3556, SONOR),
    depth: ArchetypeBand.metres(0.3048, 0.3048, SONOR),
    mass: ArchetypeBand.of(
      "kg",
      4.9,
      6,
      `${SONOR}; the MP 1412 without the X strainer at 4.9 kg, as a search result gives Sonor's page`,
      true,
    ),
  },
  bugle: {
    length: ArchetypeBand.metres(0.368, 0.381, BUGLE, true),
    bell: ArchetypeBand.metres(0.107, 0.126, BUGLE, true),
    mass: ArchetypeBand.of("kg", 0.68, 0.68, BUGLE, true),
  },
};

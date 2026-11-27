import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeInstrument } from "../AutoMovieArchetypeInstrument";

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

/** The luthier's table read. */
const LUTHIER: string =
  "Hans Johannsson, violin measurements, the 4/4 column: rib height 30 mm, neck thickness 19.5 mm at the body, fingerboard 24.5 mm wide at the nut, string spacing 16.5 mm at the nut and 34 mm at the bridge, bridge about 33 mm high (https://hansjohannsson.com/resources/mesvioli.html)";

/** The keys' travel and the sharps' rise, from a search only. */
const ACTION: string =
  "a key's dip of 3/8 to 1/2 in (Steve's Piano Service) or 10 mm (a technician's forum post), and sharps rising about 1/2 in above the naturals, as search results give them; not read";

/** The drum read. */
const SONOR: string =
  "Sonor MP 1412 X parade snare drum, 14 x 12 in, 6.0 kg (https://www.sonor.com/marching/instruments/products/mp-1412-x)";

/** The bugle, from a search only. */
const BUGLE: string =
  "G bugles 14 1/2 to 15 in long with bells of 107 to 126 mm, about 680 g, as search results give museum records (emuseum.nmmusd.org) and retailers' listings; not read";

/** The band of each free dimension of {@link createInstrument}, by kind. */
export const INSTRUMENT_BANDS: Readonly<
  Record<
    AutoMovieArchetypeInstrument.Kind,
    Readonly<
      Partial<Record<AutoMovieArchetypeInstrument.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  uprightPiano: {
    height: AutoMovieArchetypeBand.metres(1.21, 1.21, U1, true),
    width: AutoMovieArchetypeBand.metres(1.53, 1.53, U1, true),
    depth: AutoMovieArchetypeBand.metres(0.61, 0.62, U1, true),
    keyHeight: AutoMovieArchetypeBand.metres(
      28 * AutoMovieArchetypeUnits.INCH,
      30.5 * AutoMovieArchetypeUnits.INCH,
      KEYTOP,
      true,
    ),
    octave: AutoMovieArchetypeBand.metres(0.164, 0.165, KEYS, true),
    keyLength: AutoMovieArchetypeBand.metres(0.15, 0.15, KEYS, true),
    blackLength: AutoMovieArchetypeBand.metres(0.095, 0.095, KEYS, true),
    dip: AutoMovieArchetypeBand.metres(
      (3 / 8) * AutoMovieArchetypeUnits.INCH,
      (1 / 2) * AutoMovieArchetypeUnits.INCH,
      ACTION,
      true,
    ),
    blackRise: AutoMovieArchetypeBand.metres(
      (1 / 2) * AutoMovieArchetypeUnits.INCH,
      (1 / 2) * AutoMovieArchetypeUnits.INCH,
      ACTION,
      true,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 228, 228, U1, true),
  },
  guitar: {
    scale: AutoMovieArchetypeBand.metres(
      25.4 * AutoMovieArchetypeUnits.INCH,
      25.4 * AutoMovieArchetypeUnits.INCH,
      D28,
    ),
    nut: AutoMovieArchetypeBand.metres(
      1.75 * AutoMovieArchetypeUnits.INCH,
      1.75 * AutoMovieArchetypeUnits.INCH,
      D28,
    ),
    saddle: AutoMovieArchetypeBand.metres(
      (2 + 5 / 32) * AutoMovieArchetypeUnits.INCH,
      (2 + 5 / 32) * AutoMovieArchetypeUnits.INCH,
      D28,
    ),
    bodyLength: AutoMovieArchetypeBand.metres(
      20 * AutoMovieArchetypeUnits.INCH,
      20 * AutoMovieArchetypeUnits.INCH,
      D28_BODY,
      true,
    ),
    bodyWidth: AutoMovieArchetypeBand.metres(
      (15 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      (15 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      D28_BODY,
      true,
    ),
    bodyDepth: AutoMovieArchetypeBand.metres(
      (4 + 7 / 8) * AutoMovieArchetypeUnits.INCH,
      (4 + 7 / 8) * AutoMovieArchetypeUnits.INCH,
      D28_BODY,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      4 * AutoMovieArchetypeUnits.POUND + 4 * AutoMovieArchetypeUnits.OUNCE,
      4 * AutoMovieArchetypeUnits.POUND + 12 * AutoMovieArchetypeUnits.OUNCE,
      D28_BODY,
      true,
    ),
  },
  violin: {
    bodyLength: AutoMovieArchetypeBand.metres(0.355, 0.355, VIOLIN),
    scale: AutoMovieArchetypeBand.metres(0.327, 0.327, VIOLIN),
    neck: AutoMovieArchetypeBand.metres(0.138, 0.138, VIOLIN),
    upperBout: AutoMovieArchetypeBand.metres(0.168, 0.168, VIOLIN),
    waist: AutoMovieArchetypeBand.metres(0.116, 0.116, VIOLIN),
    lowerBout: AutoMovieArchetypeBand.metres(0.206, 0.206, VIOLIN),
    rib: AutoMovieArchetypeBand.metres(0.03, 0.03, LUTHIER),
    neckThickness: AutoMovieArchetypeBand.metres(0.0195, 0.0195, LUTHIER),
    fingerboard: AutoMovieArchetypeBand.metres(0.0245, 0.0245, LUTHIER),
    nutSpacing: AutoMovieArchetypeBand.metres(0.0165, 0.0165, LUTHIER),
    bridgeSpacing: AutoMovieArchetypeBand.metres(0.034, 0.034, LUTHIER),
    bridgeHeight: AutoMovieArchetypeBand.metres(0.033, 0.033, LUTHIER),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.4,
      0.5,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  sideDrum: {
    diameter: AutoMovieArchetypeBand.metres(
      14 * AutoMovieArchetypeUnits.INCH,
      14 * AutoMovieArchetypeUnits.INCH,
      SONOR,
    ),
    depth: AutoMovieArchetypeBand.metres(
      AutoMovieArchetypeUnits.FOOT,
      AutoMovieArchetypeUnits.FOOT,
      SONOR,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      4.9,
      6,
      `${SONOR}; the MP 1412 without the X strainer at 4.9 kg, as a search result gives Sonor's page`,
      true,
    ),
  },
  bugle: {
    length: AutoMovieArchetypeBand.metres(
      14.5 * AutoMovieArchetypeUnits.INCH,
      15 * AutoMovieArchetypeUnits.INCH,
      BUGLE,
      true,
    ),
    bell: AutoMovieArchetypeBand.metres(0.107, 0.126, BUGLE, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.68, 0.68, BUGLE, true),
  },
};

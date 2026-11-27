import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeInstrument } from "../AutoMovieArchetypeInstrument";
import { InstrumentBandsData } from "./internal/InstrumentBandsData";

/*
 * The band of each free dimension of createInstrument, by kind.
 */
export const INSTRUMENT_BANDS: Readonly<
  Record<
    AutoMovieArchetypeInstrument.Kind,
    Readonly<
      Partial<Record<AutoMovieArchetypeInstrument.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  uprightPiano: {
    height: AutoMovieArchetypeBand.metres(1.21, 1.21, InstrumentBandsData.U1, true),
    width: AutoMovieArchetypeBand.metres(1.53, 1.53, InstrumentBandsData.U1, true),
    depth: AutoMovieArchetypeBand.metres(0.61, 0.62, InstrumentBandsData.U1, true),
    keyHeight: AutoMovieArchetypeBand.metres(
      28 * AutoMovieArchetypeUnits.INCH,
      30.5 * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.KEYTOP,
      true,
    ),
    octave: AutoMovieArchetypeBand.metres(0.164, 0.165, InstrumentBandsData.KEYS, true),
    keyLength: AutoMovieArchetypeBand.metres(0.15, 0.15, InstrumentBandsData.KEYS, true),
    blackLength: AutoMovieArchetypeBand.metres(0.095, 0.095, InstrumentBandsData.KEYS, true),
    dip: AutoMovieArchetypeBand.metres(
      (3 / 8) * AutoMovieArchetypeUnits.INCH,
      (1 / 2) * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.ACTION,
      true,
    ),
    blackRise: AutoMovieArchetypeBand.metres(
      (1 / 2) * AutoMovieArchetypeUnits.INCH,
      (1 / 2) * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.ACTION,
      true,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 228, 228, InstrumentBandsData.U1, true),
  },
  guitar: {
    scale: AutoMovieArchetypeBand.metres(
      25.4 * AutoMovieArchetypeUnits.INCH,
      25.4 * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.D28,
    ),
    nut: AutoMovieArchetypeBand.metres(
      1.75 * AutoMovieArchetypeUnits.INCH,
      1.75 * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.D28,
    ),
    saddle: AutoMovieArchetypeBand.metres(
      (2 + 5 / 32) * AutoMovieArchetypeUnits.INCH,
      (2 + 5 / 32) * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.D28,
    ),
    bodyLength: AutoMovieArchetypeBand.metres(
      20 * AutoMovieArchetypeUnits.INCH,
      20 * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.D28_BODY,
      true,
    ),
    bodyWidth: AutoMovieArchetypeBand.metres(
      (15 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      (15 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.D28_BODY,
      true,
    ),
    bodyDepth: AutoMovieArchetypeBand.metres(
      (4 + 7 / 8) * AutoMovieArchetypeUnits.INCH,
      (4 + 7 / 8) * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.D28_BODY,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      4 * AutoMovieArchetypeUnits.POUND + 4 * AutoMovieArchetypeUnits.OUNCE,
      4 * AutoMovieArchetypeUnits.POUND + 12 * AutoMovieArchetypeUnits.OUNCE,
      InstrumentBandsData.D28_BODY,
      true,
    ),
  },
  violin: {
    bodyLength: AutoMovieArchetypeBand.metres(0.355, 0.355, InstrumentBandsData.VIOLIN),
    scale: AutoMovieArchetypeBand.metres(0.327, 0.327, InstrumentBandsData.VIOLIN),
    neck: AutoMovieArchetypeBand.metres(0.138, 0.138, InstrumentBandsData.VIOLIN),
    upperBout: AutoMovieArchetypeBand.metres(0.168, 0.168, InstrumentBandsData.VIOLIN),
    waist: AutoMovieArchetypeBand.metres(0.116, 0.116, InstrumentBandsData.VIOLIN),
    lowerBout: AutoMovieArchetypeBand.metres(0.206, 0.206, InstrumentBandsData.VIOLIN),
    rib: AutoMovieArchetypeBand.metres(0.03, 0.03, InstrumentBandsData.LUTHIER),
    neckThickness: AutoMovieArchetypeBand.metres(0.0195, 0.0195, InstrumentBandsData.LUTHIER),
    fingerboard: AutoMovieArchetypeBand.metres(0.0245, 0.0245, InstrumentBandsData.LUTHIER),
    nutSpacing: AutoMovieArchetypeBand.metres(0.0165, 0.0165, InstrumentBandsData.LUTHIER),
    bridgeSpacing: AutoMovieArchetypeBand.metres(0.034, 0.034, InstrumentBandsData.LUTHIER),
    bridgeHeight: AutoMovieArchetypeBand.metres(0.033, 0.033, InstrumentBandsData.LUTHIER),
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
      InstrumentBandsData.SONOR,
    ),
    depth: AutoMovieArchetypeBand.metres(
      AutoMovieArchetypeUnits.FOOT,
      AutoMovieArchetypeUnits.FOOT,
      InstrumentBandsData.SONOR,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      4.9,
      6,
      `${InstrumentBandsData.SONOR}; the MP 1412 without the X strainer at 4.9 kg, as a search result gives Sonor's page`,
      true,
    ),
  },
  bugle: {
    length: AutoMovieArchetypeBand.metres(
      14.5 * AutoMovieArchetypeUnits.INCH,
      15 * AutoMovieArchetypeUnits.INCH,
      InstrumentBandsData.BUGLE,
      true,
    ),
    bell: AutoMovieArchetypeBand.metres(0.107, 0.126, InstrumentBandsData.BUGLE, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.68, 0.68, InstrumentBandsData.BUGLE, true),
  },
};

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
} from "../core";
import { INSTRUMENT_BANDS } from "./INSTRUMENT_BANDS";
import type { AutoMovieArchetypeInstrument } from "./AutoMovieArchetypeInstrument";

/** The bands and build session shared by the musical instrument producers. */
export namespace InstrumentBuild {
  /** The original units of the instrument dimensions. */
  export const UNITS: Readonly<
    Record<AutoMovieArchetypeInstrument.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    width: "m",
    depth: "m",
    keyHeight: "m",
    octave: "m",
    keyLength: "m",
    blackLength: "m",
    dip: "m",
    blackRise: "m",
    scale: "m",
    nut: "m",
    saddle: "m",
    bodyLength: "m",
    bodyWidth: "m",
    bodyDepth: "m",
    neck: "m",
    upperBout: "m",
    waist: "m",
    lowerBout: "m",
    rib: "m",
    neckThickness: "m",
    fingerboard: "m",
    nutSpacing: "m",
    bridgeSpacing: "m",
    bridgeHeight: "m",
    length: "m",
    diameter: "m",
    bell: "m",
    mass: "kg",
  };

  /** The recorded bands for each instrument. */
  export const BANDS: typeof INSTRUMENT_BANDS = INSTRUMENT_BANDS;

  /**
   * Build one instrument in the original seed namespace and return its local
   * parts and contacts.
   */
  export function create<Id extends AutoMovieArchetypeInstrument.Affordance>(
    kind: AutoMovieArchetypeInstrument.Kind,
    name: string,
    params: Readonly<Partial<Omit<AutoMovieArchetypeInstrument.IParams, "kind">>>,
    seed: number | undefined,
    construct: (
      builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeInstrument.Dimension>,
      dimensions: Partial<Record<AutoMovieArchetypeInstrument.Dimension, number>>,
    ) => void,
  ): AutoMovieArchetype<Id, AutoMovieArchetypeInstrument.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeInstrument.Dimension> =
      new AutoMovieArchetypeDrawSession("instrument", UNITS, seed, params);
    const dimensions: Partial<Record<AutoMovieArchetypeInstrument.Dimension, number>> =
      draw.dimensions(BANDS[kind], BANDS);
    const builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeInstrument.Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name,
        draw,
      });
    construct(builder, dimensions);
    return builder.build(dimensions.mass!);
  }
}

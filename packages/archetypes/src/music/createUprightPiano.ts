import type { AutoMovieArchetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { KeyboardConstruction } from "./KeyboardConstruction";
import type { createInstrument } from "./createInstrument";

/**
 * An upright piano with articulating keys, fallboard and damper pedal.
 *
 * The piano stands with its back at the origin's Z, its keyboard toward +Z and
 * the bass keys at -X. A foot presses damperPedal and each key has its own
 * travel.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createUprightPiano(
  params: createUprightPiano.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createUprightPiano.Affordance,
  createUprightPiano.Dimension
> {
  return InstrumentBuild.create<createUprightPiano.Affordance>(
    "uprightPiano",
    "upright piano",
    params,
    seed,
    KeyboardConstruction.uprightPiano,
  );
}

/** The authored parameters and contact names for {@link createUprightPiano}. */
export namespace createUprightPiano {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "blackLength"
    | "blackRise"
    | "depth"
    | "dip"
    | "height"
    | "keyHeight"
    | "keyLength"
    | "mass"
    | "octave"
    | "width";

  /** The named playing and carrying contacts. */
  export type Affordance =
    | "damperPedal"
    | "damperPedalHinge"
    | "keybed"
    | "lid"
    | `key${number}`;

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    | "id"
    | "height"
    | "width"
    | "depth"
    | "keyHeight"
    | "octave"
    | "keyLength"
    | "blackLength"
    | "dip"
    | "blackRise"
    | "mass"
  >;
}

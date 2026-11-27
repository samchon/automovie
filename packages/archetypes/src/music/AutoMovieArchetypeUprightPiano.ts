import { type AutoMovieArchetype } from "../core/index";
import { createUprightPiano as createUprightPianoImplementation } from "./internal/createUprightPiano";
import { type AutoMovieArchetypeInstrument } from "./AutoMovieArchetypeInstrument";

/** Public operations for Auto Movie Archetype Upright Piano. */
export namespace AutoMovieArchetypeUprightPiano {
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
  export function create(params?: AutoMovieArchetypeUprightPiano.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeUprightPiano.Affordance,
  AutoMovieArchetypeUprightPiano.Dimension
> {
    return createUprightPianoImplementation(params, seed);
  }

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
    AutoMovieArchetypeInstrument.IParams,
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
  >;}

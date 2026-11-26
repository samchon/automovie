import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { AutoMovieArchetypeBugle } from "./AutoMovieArchetypeBugle";
import { AutoMovieArchetypeGuitar } from "./AutoMovieArchetypeGuitar";
import { AutoMovieArchetypeSideDrum } from "./AutoMovieArchetypeSideDrum";
import { AutoMovieArchetypeUprightPiano } from "./AutoMovieArchetypeUprightPiano";
import { AutoMovieArchetypeViolin } from "./AutoMovieArchetypeViolin";

/**
 * Reads a saved instrument recipe using its canonical producer.
 *
 * @param params The saved kind, optional identifier and any dimensions or
 *   choices the author supplied.
 * @param seed The seed used by the selected producer.
 * @returns The original model and its contacts.
 * @throws {AutoMovieArchetypeRefusal} When the saved kind, choice or dimension
 *   cannot be realized.
 */
export function createInstrument(
  params: createInstrument.IParams,
  seed?: number,
): AutoMovieArchetype<createInstrument.Affordance, createInstrument.Dimension> {
  const kind: createInstrument.Kind = ArchetypeDraw.choice(
    "instrument",
    "kind",
    params.kind,
    createInstrument.KINDS,
  );
  return createInstrument.PRODUCERS[kind](params, seed);
}

/** Companion types and bands of {@link createInstrument}. */
export namespace createInstrument {
  /** The kinds of instrument. */
  export type Kind =
    | "uprightPiano"
    | "guitar"
    | "violin"
    | "sideDrum"
    | "bugle";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "uprightPiano",
    "guitar",
    "violin",
    "sideDrum",
    "bugle",
  ];

  /**
   * The affordance ids, by kind:
   *
   * - UprightPiano: `key1` to `key88` (buttons), `keybed` (surface), `lid` and
   *   `damperPedalHinge` (hinges), `damperPedal` (pedal);
   * - Guitar: `fret1` to `fret20` and `string1` to `string6` (bars), `neck`
   *   (bar), `body` (surface);
   * - Violin: `string1` to `string4` (bars), `neck` (bar);
   * - SideDrum: `head` (surface), `sling` (hook);
   * - Bugle: `grip` (handle), `mouthpiece` (socket).
   */
  export type Affordance =
    | `key${number}`
    | "keybed"
    | "lid"
    | "damperPedal"
    | "damperPedalHinge"
    | `fret${number}`
    | `string${number}`
    | "neck"
    | "body"
    | "head"
    | "sling"
    | "grip"
    | "mouthpiece";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`, `width`, `depth`: a piano's case; a drum's shell `depth`.
   * - `keyHeight`, `octave`, `keyLength`, `blackLength`: a piano's key tops above
   *   the floor, one octave's span, a white and a black key's length; `dip`: a
   *   key's travel; `blackRise`: a black key's top above the white keys'.
   * - `scale`: the strings' sounding length from the nut; `nut`: a guitar's nut
   *   width; `saddle`: its outer strings' span at the saddle.
   * - `bodyLength`, `bodyWidth`, `bodyDepth`: a guitar's body; a violin's back
   *   length.
   * - `neck`: a violin's neck from the body to the nut; `upperBout`, `waist`,
   *   `lowerBout`: its widths; `rib`: its rib height; `neckThickness`,
   *   `fingerboard`: its neck's thickness and its fingerboard's width;
   *   `nutSpacing`, `bridgeSpacing`, `bridgeHeight`: its outer strings' span at
   *   the nut and the bridge and the bridge's height.
   * - `length`: a bugle's; `diameter`: a drum's; `bell`: a bugle's bell.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "height"
    | "width"
    | "depth"
    | "keyHeight"
    | "octave"
    | "keyLength"
    | "blackLength"
    | "dip"
    | "blackRise"
    | "scale"
    | "nut"
    | "saddle"
    | "bodyLength"
    | "bodyWidth"
    | "bodyDepth"
    | "neck"
    | "upperBout"
    | "waist"
    | "lowerBout"
    | "rib"
    | "neckThickness"
    | "fingerboard"
    | "nutSpacing"
    | "bridgeSpacing"
    | "bridgeHeight"
    | "length"
    | "diameter"
    | "bell"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof InstrumentBuild.UNITS = InstrumentBuild.UNITS;

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which instrument. */
    kind: Kind;

    /** The model's id, unique in a scene; `instrument` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: typeof InstrumentBuild.BANDS = InstrumentBuild.BANDS;

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `uprightPiano` selector. */
    uprightPiano: typeof AutoMovieArchetypeUprightPiano.create;

    /** The named producer for the saved `guitar` selector. */
    guitar: typeof AutoMovieArchetypeGuitar.create;

    /** The named producer for the saved `violin` selector. */
    violin: typeof AutoMovieArchetypeViolin.create;

    /** The named producer for the saved `sideDrum` selector. */
    sideDrum: typeof AutoMovieArchetypeSideDrum.create;

    /** The named producer for the saved `bugle` selector. */
    bugle: typeof AutoMovieArchetypeBugle.create;
  }

  /** The canonical producer for each saved kind. */
  export const PRODUCERS: Readonly<IProducers> = {
    uprightPiano: AutoMovieArchetypeUprightPiano.create,
    guitar: AutoMovieArchetypeGuitar.create,
    violin: AutoMovieArchetypeViolin.create,
    sideDrum: AutoMovieArchetypeSideDrum.create,
    bugle: AutoMovieArchetypeBugle.create,
  };
}

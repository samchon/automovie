import { type Archetype, ArchetypeDraw } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { createBugle } from "./createBugle";
import { createGuitar } from "./createGuitar";
import { createSideDrum } from "./createSideDrum";
import { createUprightPiano } from "./createUprightPiano";
import { createViolin } from "./createViolin";

/**
 * Reads a saved instrument recipe using its canonical producer.
 *
 * @param params The saved kind, optional identifier and any dimensions or choices the author supplied.
 * @param seed The seed used by the selected producer.
 * @returns The original model and its contacts.
 * @throws {ArchetypeRefusal} When the saved kind, choice or dimension cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the saved input and selected model.
 * @evidence contracts/development/implementation.md#principled-implementation Admit the saved kind and use its producer's bands and original seed domain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the kind and call the corresponding public producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The selected producer still validates the original dimensions and choices.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed kind table selects the producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The saved and named calls use the same construction.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createInstrument(
  params: createInstrument.IParams,
  seed?: number | string,
): Archetype<createInstrument.Affordance, createInstrument.Dimension> {
  const kind: createInstrument.Kind = ArchetypeDraw.choice(
    "instrument",
    "kind",
    params.kind,
    createInstrument.KINDS,
  );
  return createInstrument.PRODUCERS[kind](params, seed);
}

/**
 * Companion types and bands of {@link createInstrument}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is.
 * @evidence contracts/development/design.md#principled-representation Closed unions; template ids number the keys, frets and strings over any count, the precedent of a ladder's rungs; one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The keys, frets, strings and holds the playing and carrying acts read (#3446, #3465, #3466).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A key is a pressed part, never a flag; a fret is a place on the fingerboard, not a part.
 */
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
   * - uprightPiano: `key1` to `key88` (buttons), `keybed` (surface), `lid` and `damperPedalHinge` (hinges), `damperPedal` (pedal);
   * - guitar: `fret1` to `fret20` and `string1` to `string6` (bars), `neck` (bar), `body` (surface);
   * - violin: `string1` to `string4` (bars), `neck` (bar);
   * - sideDrum: `head` (surface), `sling` (hook);
   * - bugle: `grip` (handle), `mouthpiece` (socket).
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
   * - `keyHeight`, `octave`, `keyLength`, `blackLength`: a piano's key tops above the floor, one octave's span, a white and a black key's length; `dip`: a key's travel; `blackRise`: a black key's top above the white keys'.
   * - `scale`: the strings' sounding length from the nut; `nut`: a guitar's nut width; `saddle`: its outer strings' span at the saddle.
   * - `bodyLength`, `bodyWidth`, `bodyDepth`: a guitar's body; a violin's back length.
   * - `neck`: a violin's neck from the body to the nut; `upperBout`, `waist`, `lowerBout`: its widths; `rib`: its rib height; `neckThickness`, `fingerboard`: its neck's thickness and its fingerboard's width; `nutSpacing`, `bridgeSpacing`, `bridgeHeight`: its outer strings' span at the nut and the bridge and the bridge's height.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
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
    uprightPiano: typeof createUprightPiano;

    /** The named producer for the saved `guitar` selector. */
    guitar: typeof createGuitar;

    /** The named producer for the saved `violin` selector. */
    violin: typeof createViolin;

    /** The named producer for the saved `sideDrum` selector. */
    sideDrum: typeof createSideDrum;

    /** The named producer for the saved `bugle` selector. */
    bugle: typeof createBugle;
  }

  /** The canonical producer for each saved kind. */
  export const PRODUCERS: Readonly<IProducers> = {
    uprightPiano: createUprightPiano,
    guitar: createGuitar,
    violin: createViolin,
    sideDrum: createSideDrum,
    bugle: createBugle,
  };
}

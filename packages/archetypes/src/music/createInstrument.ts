import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  type IArchetypeBand,
} from "../core";
import { INSTRUMENT_BANDS } from "./INSTRUMENT_BANDS";
import { KeyboardConstruction } from "./KeyboardConstruction";
import { MarchingConstruction } from "./MarchingConstruction";
import { StringedConstruction } from "./StringedConstruction";

/**
 * A musical instrument: an upright piano, a steel-string guitar, a violin, a side drum or a bugle, with the keys, frets and strings a hand plays numbered as contacts.
 *
 * - An upright piano stands with its back at the origin's `Z` and its keyboard toward `+Z`, the bass at `-X`. `key1` to `key88` are its keys from the bottom A, each a `button` pressed down by its dip and moving its own key; `keybed` the keyboard's top, a surface; `lid` the fallboard's hinge, the fallboard standing open at rest and laid over the keys by its travel. A production seats a player on a `createSeat` bench.
 * - A guitar and a violin lie on their backs with the neck toward `+X`, the body's neck end at the origin's `X`. `string1` to `string6` (four on a violin) run from the nut to the saddle or bridge, `string1` the highest on the `-Z` edge; a guitar's `fret1` to `fret20` are the places a fingertip stops the strings behind each fret, each a bar across the fingerboard whose sites run across the strings; `neck` is the neck the fretting hand grips; a guitar's `body` is where the strumming hand meets the strings. A violin's chinrest and its bow are not built: no source read places the one or sizes the other's hold.
 * - A side drum stands on its bottom head: `head` the batter head the sticks strike, `sling` the hook a sling or a carrier holds it by.
 * - A bugle lies on its side, its bell toward `+X`: `grip` where a hand holds it, `mouthpiece` the socket the lips meet.
 *
 * Playing a note by finger, fret or key needs the finger campaign's laws (#3445, #3446); holding, carrying and the drummer's march do not.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The instrument.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind lies or stands, every contact and its numbering, and which laws playing waits on.
 * @evidence contracts/development/implementation.md#principled-implementation Draws the kind's cited bands and hands them to its family's construction: `KeyboardConstruction` lays the 88 keys by the keyboard's pitch pattern, `StringedConstruction` places frets by equal temperament and strings from nut to bridge, `MarchingConstruction` builds the drum and the bugle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the kind, draw the dimensions, build the kind, state the mass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every size no source gives is a named estimate of its construction; strings are contacts without parts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the keys, frets and strings, ninety-odd parts for a piano.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
  const d: Partial<Record<createInstrument.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "instrument",
      createInstrument.BANDS[kind],
      seed,
      params,
      createInstrument.BANDS,
    );
  const builder: ArchetypeBuilder<
    createInstrument.Affordance,
    createInstrument.Dimension
  > = new ArchetypeBuilder({
    archetype: "instrument",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  if (kind === "uprightPiano") KeyboardConstruction.uprightPiano(builder, d);
  else if (kind === "sideDrum" || kind === "bugle")
    MarchingConstruction[kind](builder, d);
  else StringedConstruction[kind](builder, d);
  return builder.build(d.mass!);
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
   * - uprightPiano: `key1` to `key88` (buttons), `keybed` (surface), `lid` (hinge);
   * - guitar: `fret1` to `fret20` and `string1` to `string6` (bars), `neck` (bar), `body` (surface);
   * - violin: `string1` to `string4` (bars), `neck` (bar);
   * - sideDrum: `head` (surface), `sling` (hook);
   * - bugle: `grip` (handle), `mouthpiece` (socket).
   */
  export type Affordance =
    | `key${number}`
    | "keybed"
    | "lid"
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which instrument. */
    kind: Kind;

    /** The model's id, unique in a scene; `instrument` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = INSTRUMENT_BANDS;
}

/** Each kind's readable name. */
const NAMES: Readonly<Record<createInstrument.Kind, string>> = {
  uprightPiano: "upright piano",
  guitar: "guitar",
  violin: "violin",
  sideDrum: "side drum",
  bugle: "bugle",
};

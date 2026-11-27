import { ArchetypeDraw, type AutoMovieArchetype } from "../core/index";
import { InstrumentBuild } from "./InstrumentBuild";
import { createCymbal as createCymbalImplementation } from "./internal/createCymbal";
import { createDrumstick as createDrumstickImplementation } from "./internal/createDrumstick";
import { createViolinBow as createViolinBowImplementation } from "./internal/createViolinBow";
import { AutoMovieArchetypeBugle } from "./AutoMovieArchetypeBugle";
import { AutoMovieArchetypeGuitar } from "./AutoMovieArchetypeGuitar";
import { AutoMovieArchetypeSideDrum } from "./AutoMovieArchetypeSideDrum";
import { AutoMovieArchetypeUprightPiano } from "./AutoMovieArchetypeUprightPiano";
import { AutoMovieArchetypeViolin } from "./AutoMovieArchetypeViolin";

/** Constructs the instrument archetype from its recipe. */
export namespace AutoMovieArchetypeInstrument {
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
export function create(
  params: AutoMovieArchetypeInstrument.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeInstrument.Affordance, AutoMovieArchetypeInstrument.Dimension> {
  const kind: AutoMovieArchetypeInstrument.Kind = ArchetypeDraw.choice(
    "instrument",
    "kind",
    params.kind,
    AutoMovieArchetypeInstrument.KINDS,
  );
  return AutoMovieArchetypeInstrument.PRODUCERS[kind](params, seed);
}

/**
 * A stationary 16-inch crash cymbal on a straight tripod stand. The diameter
 * and raised bell follow Zildjian's cymbal anatomy
 * (https://ae.zildjian.com/wp-content/uploads/Zildjian_Drum_Method_Lesson_11.pdf).
 * The 0.85 m plate height is a scenic setting within Yamaha's CS650A range
 * (https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/hardware/cymbal_stands/specs.html).
 * The plate thickness, bell and stand proportions and assembly mass are scenic
 * estimates for the rigid prop.
 *
 * @param params The model id, supplied as an option or as a positional string.
 * @returns The mounted cymbal with the upward-facing `edge` on the rim at local
 *   −Z and `bell` at the raised center.
 */
export function createCymbal(
  params: { id?: string } | string = {},
): AutoMovieArchetype<"edge" | "bell", never> {
  return createCymbalImplementation(params);
}

/**
 * A scenic wooden drumstick along +Y, with its butt at the origin. The overall
 * length and shaft diameter follow the Vic Firth American Classic 5A
 * (https://vicfirth.com/products/american-classicr-5a-doubleglaze-double-coat-of-lacquer-finish).
 * The shoulder, spherical bead, grip placement and 50 g mass are scenic
 * estimates. `face` is the bead's tangent point on +Z. The grip frame is offset
 * by the same amount, so the line to the face follows the stick and the shaft
 * clears the head when the bead lands.
 *
 * @param params The model id, supplied as an option or as a positional string.
 * @returns A rigid wooden stick with `grip` and `face` contacts.
 */
export function createDrumstick(
  params: { id?: string } | string = {},
): AutoMovieArchetype<"grip" | "face", never> {
  return createDrumstickImplementation(params);
}

/**
 * A full-size violin bow along +X, hair on the bottom, with a grip by the frog.
 * The overall length (745 mm), hair length (649 mm), mass (61 g) and head
 * height (23 mm) follow Birmingham City University's James Tubbs bow catalogue
 * 10.31
 * (https://www.bcu.ac.uk/conservatoire/research/hic/the-collection/string-bow/10-31).
 * Stick diameter, frog width, grip placement and ribbon section are coarse
 * estimates. The stick is rigid. The hair contacts mark the underside of the
 * ribbon at the frog and tip, with outward normals facing the string.
 *
 * @param params The model id, supplied as an option or as a positional string.
 * @returns A bow with grip, hairFrog and hairTip affordances.
 */
export function createViolinBow(
  params: { id?: string } | string = {},
): AutoMovieArchetype<"grip" | "hairFrog" | "hairTip", never> {
  return createViolinBowImplementation(params);
}

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

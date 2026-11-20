import type { Archetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { KeyboardConstruction } from "./KeyboardConstruction";
import type { createInstrument } from "./createInstrument";

/**
 * An upright piano with articulating keys, fallboard and damper pedal.
 *
 * The piano stands with its back at the origin's Z, its keyboard toward +Z and the bass keys at -X. A foot presses damperPedal and each key has its own travel.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Place keys by octave and semitone and derive their top faces and dip from the keyboard dimensions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keep the numbered keys, distinct fallboard and moving pedal from the retained upright construction.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds 88 articulated keys and a fixed set of case and pedal parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createUprightPiano(
  params: createUprightPiano.IParams = {},
  seed?: number | string,
): Archetype<createUprightPiano.Affordance, createInstrument.Dimension> {
  return InstrumentBuild.create<createUprightPiano.Affordance>(
    "uprightPiano",
    "upright piano",
    params,
    seed,
    KeyboardConstruction.uprightPiano,
  );
}

/**
 * The authored parameters and contact names for {@link createUprightPiano}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation The contact union describes the playing and carrying sites of this instrument. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createUprightPiano {
  /** The named playing and carrying contacts. */
  export type Affordance =
    | `key${number}`
    | "keybed"
    | "lid"
    | "damperPedal"
    | "damperPedalHinge";

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

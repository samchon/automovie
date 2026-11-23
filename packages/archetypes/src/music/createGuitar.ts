import type { AutoMovieArchetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { StringedConstruction } from "./StringedConstruction";
import type { createInstrument } from "./createInstrument";

/**
 * A steel-string guitar with numbered fret and string contacts.
 *
 * The guitar lies on its back with the neck along +X, the body to -X and string1 on its -Z edge. The neck and body contacts support fretting and strumming.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Use equal-tempered fret placement and interpolate string positions between the nut and saddle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Strings and frets are contacts on the board. The footprint and strings use the recorded bands.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds 20 frets, six strings and a fixed set of body and neck parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createGuitar(
  params: createGuitar.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createGuitar.Affordance, createGuitar.Dimension> {
  return InstrumentBuild.create<createGuitar.Affordance>(
    "guitar",
    "guitar",
    params,
    seed,
    StringedConstruction.guitar,
  );
}

/**
 * The authored parameters and contact names for {@link createGuitar}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation The contact union describes the playing and carrying sites of this instrument. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createGuitar {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "bodyDepth"
    | "bodyLength"
    | "bodyWidth"
    | "mass"
    | "nut"
    | "saddle"
    | "scale";

  /** The named playing and carrying contacts. */
  export type Affordance =
    | "body"
    | "neck"
    | `fret${number}`
    | `string${number}`;

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    | "id"
    | "scale"
    | "nut"
    | "saddle"
    | "bodyLength"
    | "bodyWidth"
    | "bodyDepth"
    | "mass"
  >;
}

import type { Archetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { StringedConstruction } from "./StringedConstruction";
import type { createInstrument } from "./createInstrument";

/**
 * A violin with four bowed-string contacts and a neck grasp.
 *
 * The violin lies on its back with the neck along +X and string1 on its -Z edge. The bow is made separately with createViolinBow.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Build the rib and neck from the drawn widths, and place the four strings from nut to bridge.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Strings are represented by contacts. The chinrest is outside the retained model.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createViolin(
  params: createViolin.IParams = {},
  seed?: number | string,
): Archetype<createViolin.Affordance, createInstrument.Dimension> {
  return InstrumentBuild.create<createViolin.Affordance>(
    "violin",
    "violin",
    params,
    seed,
    StringedConstruction.violin,
  );
}

/**
 * The authored parameters and contact names for {@link createViolin}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation The contact union describes the playing and carrying sites of this instrument. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createViolin {
  /** The named playing and carrying contacts. */
  export type Affordance = `string${number}` | "neck";

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    | "id"
    | "bodyLength"
    | "scale"
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
    | "mass"
  >;
}

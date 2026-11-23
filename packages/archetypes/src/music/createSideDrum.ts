import type { AutoMovieArchetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { MarchingConstruction } from "./MarchingConstruction";
import type { createInstrument } from "./createInstrument";

/**
 * A side drum with separate batter-head and carrier contacts.
 *
 * The drum stands on its bottom head. The head surface accepts a stick contact and sling marks the carrier hook.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Build the shell and heads around their shared axis and put the strike on the upper head.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shell draws one diameter and depth, and the sling contact uses the retained hook position.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createSideDrum(
  params: createSideDrum.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createSideDrum.Affordance, createSideDrum.Dimension> {
  return InstrumentBuild.create<createSideDrum.Affordance>(
    "sideDrum",
    "side drum",
    params,
    seed,
    MarchingConstruction.sideDrum,
  );
}

/**
 * The authored parameters and contact names for {@link createSideDrum}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation The contact union describes the playing and carrying sites of this instrument. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createSideDrum {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "diameter" | "mass";

  /** The named playing and carrying contacts. */
  export type Affordance = "head" | "sling";

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    "id" | "diameter" | "depth" | "mass"
  >;
}

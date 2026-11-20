import type { Archetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { MarchingConstruction } from "./MarchingConstruction";
import type { createInstrument } from "./createInstrument";

/**
 * A bugle with a hand grip and lip socket.
 *
 * The bugle lies on its side with the bell toward +X. The mouthpiece is the socket a wind performance meets.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Construct the curved tube, bell and socket in the original side-lying frame from the drawn length and bell diameter.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The retained construction represents the fixed bugle profile with coarse parts and contact frames.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createBugle(
  params: createBugle.IParams = {},
  seed?: number | string,
): Archetype<createBugle.Affordance, createInstrument.Dimension> {
  return InstrumentBuild.create<createBugle.Affordance>(
    "bugle",
    "bugle",
    params,
    seed,
    MarchingConstruction.bugle,
  );
}

/**
 * The authored parameters and contact names for {@link createBugle}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation The contact union describes the playing and carrying sites of this instrument. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createBugle {
  /** The named playing and carrying contacts. */
  export type Affordance = "grip" | "mouthpiece";

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    "id" | "length" | "bell" | "mass"
  >;
}

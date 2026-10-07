import { instanceSlot } from "@automovie/engine";
import type { IAutoMovieCompiledInstanceSet, IAutoMovieInstanceSlot } from "@automovie/interface";

/**
 * Regenerate one exact instance from compact compiled parameters.
 *
 * The member law is the engine's {@link instanceSlot}, the one a compiled set's
 * bounds are measured with and a shot source's oracle answers through, so the
 * member drawn here is the member the compiled record holds. A viewer copy of
 * that law agreed on every valid record but refused less, and drew a
 * hand-edited record the engine refuses as members standing on non-finite
 * coordinates or painted with no swatch.
 *
 * It therefore throws what the engine throws: a slot outside the set, a route
 * snapshot that is missing, names another route, or has no finite positive
 * length, an explicit block missing the slot or naming a prototype no choice
 * declares, and a derived non-finite value or an empty palette.
 * {@link buildInstancedInstanceSet} regenerates every chunk slot through here
 * while it builds, so such a refusal leaves that call before any batch of the
 * set exists, and a host building a shot, such as a generated project's viewer
 * runtime, fails its build with the engine's message instead of drawing the
 * set.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-representation-semantic-preservation Regenerates the engine-owned stable slot, prototype and variation data used by the compact display representation.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Uses the compiled compact member law without a viewer-specific copy of layout or visibility arithmetic.
 * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Regenerates the selected grid, scatter, lattice, explicit, or route layout from its declared parameters.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Implements deterministic slot generation and assignment for that layout.
 * @evidence requirements/formations/heroes-variation-and-state.md#formation-deterministic-population Regenerates prototype, palette, scale, traits, and visibility from stable seed and slot identity.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hero-variation-group-state Implements deterministic population and variation state.
 * @evidence requirements/formations/scope-and-identity.md#formation-group-member-identity Preserves the compiled set and stable slot identity on each regenerated member.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Implements compact member identity independently of array presentation.
 * @evidence requirements/formations/terrain-and-routes.md#formation-group-path Places along-route slots on the declared compiled path.
 */
export const regenerateInstanceSlot = (
  instanceSet: IAutoMovieCompiledInstanceSet,
  slot: number,
): IAutoMovieInstanceSlot => instanceSlot(instanceSet, slot);

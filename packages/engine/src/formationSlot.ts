import { IAutoMovieFormationDesign, IAutoMovieFormationSlot } from "@automovie/interface";
import { formationSlotRecord } from "./formationSlotRecord";
import { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";
import { formationSlotPosition } from "./formationSlotPosition";

/**
 * Regenerate one exact source-designed formation slot in constant memory.
 *
 * The builder and ordinary measurement scripts share this pure derivation so a
 * slot queried from loaded project state is exactly the slot materialized into
 * the compiled formation. No filesystem or project state is consulted.
 *
 * @evidence requirements/formations/heroes-variation-and-state.md#formation-deterministic-population Regenerates stable anonymous identities, promoted heroes, positions, facing, and motion phase from formation identity, seed, and slot.
 * @evidence requirements/formations/layouts-and-slots.md#formation-slot-identity Derives the anonymous node key from formation identity and the logical slot instead of enumeration order.
 * @evidence requirements/formations/heroes-variation-and-state.md#formation-stable-background-identity Recreates a background member with the same slot-derived node and seeded motion phase across repeated materialization.
 * @evidence requirements/actors/populations-and-doubles.md#actor-prototype-variation Reuses the declared model recipe while deriving each member's motion phase from the stable formation seed and slot.
 * @evidence requirements/formations/scope-and-identity.md#formation-authoring-mode-selection Materializes one reviewable member from the compact prototype, layout, hero-override, and slot contract on demand.
 * @evidence requirements/production-design/subject-breakdown-and-asset-plan.md#production-design-subject-prototype-instance Keeps the shared model recipe distinct from the slot-derived member identity and the optional named hero actor.
 * @evidence requirements/production-design/subject-breakdown-and-asset-plan.md#production-design-hero-background Distinguishes a seeded anonymous background member from a hero override occupying the same logical slot.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-prototype-instance Reuses one declared model recipe while assigning each logical slot its own stable node, transform, motion phase, and optional hero identity.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-compression-individuality Regenerates a compact member by stable slot without erasing its independently addressable node identity or hero exception.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-pattern-local-stability Derives identity and seeded variation from the formation id and logical slot so an unrelated population change does not renumber an existing member.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Keeps logical slot identity explicit in the compact placement result.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hero-variation-group-state Applies hero override and deterministic background variation without per-member stored nodes.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-population-double-variation Combines one shared prototype with a stable member identity, seeded phase, and optional named-actor promotion.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Regenerates the same compact member record without storing or independently re-deriving anonymous nodes.
 * @evidence specifications/narrative-and-intent/locations-subjects-and-assets.md#narrative-intent-subject-prototype-role Materializes the prototype, stable slot occurrence, seeded background variation, and optional hero identity as separate fields.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-prototype-instance Keeps the shared model recipe separate from the slot-owned identity, placement, seeded phase, and hero override.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Keeps each regenerated group member independently addressable by its slot-derived node and optional actor identity.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-deterministic-instance-generation Derives the same member identity and seeded variation from the stable formation and slot inputs without storing expanded nodes.
 */
export const formationSlot = (
  formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding,
  slot: number,
): IAutoMovieFormationSlot =>
  formationSlotRecord(formation, slot, {
    actor:
      formation.heroOverrides.find((hero) => hero.slot === slot)?.actor ?? null,
    position: formationSlotPosition(formation, slot),
  });

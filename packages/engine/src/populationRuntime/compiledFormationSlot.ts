import type {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationHero,
  IAutoMovieFormationSlot,
} from "@automovie/interface";

import { formationSlotPosition } from "../formationSlotPosition";
import { formationSlotRecord } from "../formationSlotRecord";

/**
 * Regenerate one exact member of a compiled formation in constant memory.
 *
 * The compiled record is what a viewer draws and what a shot source is handed,
 * so a member is regenerated from it rather than from the design beside it. It
 * carries the terrain snapshot the builder placed the unit on, which a design
 * record does not: a member asked of the design stands at its anchor's height,
 * and the same member drawn from the compiled record stands on the rise under
 * it. The only thing the record spells differently from a design is a hero,
 * which is a promoted slot rather than an override.
 *
 * The identity law is not restated here. This and {@link formationSlot} for a
 * grounded design both hand the slot's actor and position to
 * {@link formationSlotRecord}, which names the hero actor or the slot-derived
 * node and carries the base model, the designed heading and the seeded motion
 * phase. A test pins the two answers equal for every slot of a compiled
 * formation.
 *
 * @evidence contracts/common.md#principled-implementation Regenerate the terrain-aware designed position and shared seeded identity/phase record for one slot, selecting its hero override if present; inputs follow compiled-formation admission.
 * @evidence contracts/common.md#clear-and-simple-design This adapter combines formationSlotPosition with formationSlotRecord so compiled and authored callers share the same position and identity laws.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hero membership comes from the compiled override table, with no actor-specific shortcut; numeric/slot admission remains in the called owners.
 * @evidence contracts/common.md#meaningful-documentation Docs identify compact regeneration, terrain snapshot use and hero identity; the result is one member rather than an expanded formation.
 * @evidence contracts/performance.md#efficient-algorithms One slot has fixed-size output; H hero overrides are searched and terrain sampling depends on the retained surface polygons, so total lookup is not unconditionally constant time.
 * @evidence contracts/performance.md#reuse-equivalent-work Position and record owners are reused by all formation consumers; no result cache survives mutable compiled terrain or hero overrides.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one caller-owned member record escapes; the borrowed formation and terrain snapshot are not copied or retained by a registry.
 */
export const compiledFormationSlot: (
  formation: IAutoMovieCompiledFormation,
  slot: number,
) => IAutoMovieFormationSlot = (
  formation: IAutoMovieCompiledFormation,
  slot: number,
): IAutoMovieFormationSlot =>
  formationSlotRecord(formation, slot, {
    actor:
      formation.heroes.find(
        (hero: IAutoMovieCompiledFormationHero): boolean => hero.slot === slot,
      )?.actor ?? null,
    position: formationSlotPosition(formation, slot),
  });

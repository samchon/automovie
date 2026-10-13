import {
  IAutoMovieCompiledFormation,
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
 * node and carries the base recipe, the designed heading and the seeded motion
 * phase. A test pins the two answers equal for every slot of a compiled
 * formation.
 */
export const compiledFormationSlot = (
  formation: IAutoMovieCompiledFormation,
  slot: number,
): IAutoMovieFormationSlot =>
  formationSlotRecord(formation, slot, {
    actor: formation.heroes.find((hero) => hero.slot === slot)?.actor ?? null,
    position: formationSlotPosition(formation, slot),
  });

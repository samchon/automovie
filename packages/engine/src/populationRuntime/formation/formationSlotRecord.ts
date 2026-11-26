import {
  IAutoMovieFormationSlot,
  type IAutoMovieFormationSlotRecord,
} from "@automovie/interface";

import { seededValue } from "../../math/internal/seededValue";

/**
 * The member record one formation slot regenerates to.
 *
 * A design and a compiled formation share this identity law and differ only in
 * what they hand it: where a promoted hero is spelled, and the terrain the
 * slot's position is placed on. A hero slot is named by its actor and an
 * anonymous slot by `formation:<id>:slot:<six-digit slot>`; every member
 * carries the base model and the designed heading; and its motion phase in `[0,
 * 1)` is seeded by the formation seed and the slot under the phase domain
 * constant, whichever actor or position it is handed. The slot index is not
 * range-checked here; the caller's placement already refused it.
 */
export function formationSlotRecord(
  formation: IAutoMovieFormationSlotRecord.IFormation,
  slot: number,
  member: IAutoMovieFormationSlotRecord.IMember,
): IAutoMovieFormationSlot {
  return {
    slot,
    node:
      member.actor ??
      `formation:${formation.id}:slot:${String(slot).padStart(6, "0")}`,
    actor: member.actor,
    model: formation.model,
    position: member.position,
    facingDeg: formation.facingDeg,
    motionPhase: seededValue(formation.seed, slot, 0x70686173),
  };
}

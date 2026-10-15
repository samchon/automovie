import {
  IAutoMovieFormationSlot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { seededValue } from "./math/seededValue";

/**
 * The member record one formation slot regenerates to.
 *
 * A design and a compiled formation share this identity law and differ only in
 * what they hand it: where a promoted hero is spelled, and the terrain the
 * slot's position is placed on. A hero slot is named by its actor and an
 * anonymous slot by `formation:<id>:slot:<six-digit slot>`; every member
 * carries the base model and the designed heading; and its motion phase in
 * `[0, 1)` is seeded by the formation seed and the slot under the phase domain
 * constant, whichever actor or position it is handed. The slot index is not
 * range-checked here; the caller's placement already refused it.
 *
 * @evidence contracts/common.md#principled-implementation A deterministic identity: the node id is the hero actor or a zero-padded slot key that sorts with the slot, and the phase is `seededValue` over the seed, slot and a fixed domain constant so it never correlates with the dressing or scatter draws seeded from the same pair.
 * @evidence contracts/common.md#clear-and-simple-design Takes the four formation fields it reads as a structural parameter, so both `formationSlot` and `compiledFormationSlot` pass their own record without an adapter, and the actor and position stay with those callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Heroes keep the base model and designed heading like every other member, and no slot gets a hand-written id or phase.
 * @evidence contracts/common.md#meaningful-documentation States the two callers and what differs between them, the node naming rule, the carried model and heading, the phase's seeding and range, and that range checking belongs to placement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant work per slot: one string build for an anonymous node and one seeded hash; no algorithm is chosen.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Regenerates one record per call and caches none, because a member is cheaper to rederive than to store across up to 100,000 slots.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the record is fresh and aliases the position vector the caller handed in.
 */
export const formationSlotRecord = (
  formation: {
    id: string;
    model: string;
    facingDeg: number;
    seed: number;
  },
  slot: number,
  member: { actor: string | null; position: IAutoMovieVector3 },
): IAutoMovieFormationSlot => ({
  slot,
  node:
    member.actor ??
    `formation:${formation.id}:slot:${String(slot).padStart(6, "0")}`,
  actor: member.actor,
  model: formation.model,
  position: member.position,
  facingDeg: formation.facingDeg,
  motionPhase: seededValue(formation.seed, slot, 0x70686173),
});

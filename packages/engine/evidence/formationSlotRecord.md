# src/formationSlotRecord.ts#formationSlotRecord

## @evidence contracts/development/implementation.md#principled-implementation

A deterministic identity: the node id is the hero actor or a zero-padded slot key that sorts with the slot, and the phase is `seededValue` over the seed, slot and a fixed domain constant so it never correlates with the dressing or scatter draws seeded from the same pair.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Takes the four formation fields it reads as a structural parameter, so both `formationSlot` and `compiledFormationSlot` pass their own record without an adapter, and the actor and position stay with those callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Heroes keep the base model and designed heading like every other member, and no slot gets a hand-written id or phase.

## @evidence contracts/development/common.md#meaningful-documentation

States the two callers and what differs between them, the node naming rule, the carried model and heading, the phase's seeding and range, and that range checking belongs to placement.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per slot: one string build for an anonymous node and one seeded hash; no algorithm is chosen.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Regenerates one record per call and caches none, because a member is cheaper to rederive than to store across up to 100,000 slots.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the record is fresh and aliases the position vector the caller handed in.

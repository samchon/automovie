# src/reaction/stuntFallHigh.ts#stuntFallHigh

## @evidence contracts/development/common.md#meaningful-documentation

States the flight, the turn, the landings, the descender and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The hips follow the closed-form projectile (or the capped descent) and the turn eases with the flight's progress; the pad's extent is checked at the solved contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Take-off, landing height and contact, then one posture writer over flight and settle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pad the flight misses refuses; the speeds and the yield are provisional and stated as such.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work at plan time and per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only its closed-form constants.

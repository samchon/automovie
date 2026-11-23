# src/posture/placeHumanArmGeometry.ts#placeHumanArmGeometry

## @evidence contracts/development/common.md#meaningful-documentation

States matching-chain provenance, body/frame input roles, probe ordering, optional surface probes and world-geometry result.

## @evidence contracts/development/implementation.md#principled-implementation

A hand-local fingertip and each segment-local surface probe are transformed by their actual completed chain frames; axis probes retain the existing interpolation positions and measured-body radius scaling.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner attaches probes only; HumanArmGeometry.chain owns the actual parent-first FK, so chain-only consumers can omit this unused observation phase without copying motion calculations or creating an import cycle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Existing coarse interpolation/radius-taper coefficients are unchanged conventions rather than claimed anatomical measurements; frame surface-owner indices remain aligned, and actual joint transforms are supplied rather than approximated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight axis probes plus O(P) selected surface transforms remain. Disabled surface skips its mapper/result array; enabled surface selects origin/rotation by scalar references without a temporary pair per probe. Full placement still owns its fixed chain wrapper and requested probe output; runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the same completed chain that the full placed result exposes; every selected world probe is actually transformed for this candidate and no result is retained across requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state; the caller owns the new placed wrapper and eight-plus-P probe array, sharing its completed chain vectors with the output and corresponding probe entries.

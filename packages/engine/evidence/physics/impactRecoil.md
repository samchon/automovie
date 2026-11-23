# src/physics/impactRecoil.ts#impactRecoil

## @evidence contracts/development/implementation.md#principled-implementation

Scale requested nonzero clinical axes along the chain by falloff^index, then clamp known bones through skeleton constraints and coupled ROM projection. Missing bones remain unclamped, and this is a pose heuristic rather than angular impulse integration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The chain defines spatial falloff while clampJointRom owns constraint semantics; absent or all-zero axes return null instead of authoring a rest pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Default falloff 0.6 is the exposed recoil policy; it does not vary by fixture. A nonzero target in a zero-excluding range clamps to that range's minimum rather than adding to a neutral angle.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify degree targets, finite falloff in [0,1], invalid-input throws, null for no requested response and the missing-bone limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

C chain entries each search B skeleton bones, so O(CB) lookup plus constraint projection and O(C) output; no whole-model simulation is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Constraint helpers are reused, but poses are fresh per push/chain/skeleton evaluation; mutable joint ranges rule out an identity-only cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned pose owns its new joint records; temporary chain work and failed calls retain no handles or ongoing simulation.

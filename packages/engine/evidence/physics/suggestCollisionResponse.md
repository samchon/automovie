# src/physics/suggestCollisionResponse.ts#suggestCollisionResponse

## @evidence contracts/development/implementation.md#principled-implementation

Compose resolveImpact, magnitude-to-flexion conversion and optional chain recoil; the result predicts normal velocities and a constrained pose target rather than a coupled rigid-body animation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each helper owns one responsibility: impact mechanics, gain conversion and skeletal constraint response; absent chain or skeleton gives a null flinch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Direction is lost at the magnitude-only push seam, so the struck-body label does not imply directional pose physics; no consumer-specific pose correction is added.

## @evidence contracts/development/common.md#meaningful-documentation

Docs describe response/impulse units, explicit gain and optional rig requirements; admission failures and helper exceptions propagate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Mechanics/conversion are O(1); an available C-bone chain adds impactRecoil's O(CB) skeleton lookup and O(C) pose output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The computed impact impulse is passed directly to the push conversion in this call; no cross-request cache assumes mutable body or rig equivalence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned aggregate owns its new response/push/pose records except documented borrowed no-closing velocities; no ongoing physical state or handle is retained.

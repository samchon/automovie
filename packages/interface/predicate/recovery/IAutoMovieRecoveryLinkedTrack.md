# src/recovery/IAutoMovieRecoveryLinkedTrack.ts#IAutoMovieRecoveryLinkedTrack

## @evidence contracts/development/common.md#meaningful-documentation

The track carries a deterministic component identity and one tentative observation per participating view.

## @evidence contracts/development/design.md#principled-representation

A reciprocal feature graph merges linked nodes across views. A component with duplicate view membership is counted separately and withheld before this record is emitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Linkage owns identity and observed pixels. Point and camera solvers apply independent geometric checks.

# src/recovery/IAutoMovieRecoveryLinkedTrack.ts#IAutoMovieRecoveryLinkedTrack.id

## @evidence contracts/development/common.md#meaningful-documentation

Union operations retain the smaller global feature-node index as the component root.

# src/recovery/IAutoMovieRecoveryLinkedTrack.ts#IAutoMovieRecoveryLinkedTrack.observations

## @evidence contracts/development/common.md#meaningful-documentation

The linker emits source-indexed pixel copies after rejecting duplicate-view components.

# src/recovery/IAutoMovieRecoveryMapLandmark.ts#IAutoMovieRecoveryMapLandmark

## @evidence contracts/development/common.md#meaningful-documentation

The record gives one global track identity, a reconstructed point and a list of retained observations in the map gauge.

## @evidence contracts/development/design.md#principled-representation

Landmark creation triangulates qualifying observations under the common seed gauge. Proposed support is carried through a detached fit and only the qualified population enters the accepted scene.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Track linkage supplies identity and pixels. This fitting record owns the reconstructed point and used observations. Scene landmarks add the supporting view pair after final qualification.

# src/recovery/IAutoMovieRecoveryMapLandmark.ts#IAutoMovieRecoveryMapLandmark.id

## @evidence contracts/development/common.md#meaningful-documentation

The linker derives an identity from the component's ordered feature nodes, and growth uses it to reconnect the same accepted point to future observations.

# src/recovery/IAutoMovieRecoveryMapLandmark.ts#IAutoMovieRecoveryMapLandmark.point

## @evidence contracts/development/common.md#meaningful-documentation

Both initial triangulation and joint refinement preserve the chosen common coordinate gauge.

# src/recovery/IAutoMovieRecoveryMapLandmark.ts#IAutoMovieRecoveryMapLandmark.observations

## @evidence contracts/development/common.md#meaningful-documentation

Growth tests missing measurements against the point and copies qualified locations. The joint fit uses the entire retained population.

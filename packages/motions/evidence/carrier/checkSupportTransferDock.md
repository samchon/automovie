# src/carrier/checkSupportTransferDock.ts#checkSupportTransferDock

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the time interval, sampling limit, coordinate frames and geometric tolerances.

## @evidence contracts/development/implementation.md#principled-implementation

Compares the same deck rectangle under each prop's rigid motion since entry. Corner displacements bound the entire rectangle by convexity, and the relative quaternion measures the shorter turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Docking owns frame admission and geometry checks. The transfer planner owns foot placement and timing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Checks raw frames before comparing them. Samples constrain the evaluated instants and cannot certify excursions between them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Checks two frames and at most four corners per sample, with constant temporary space and immediate refusal on failure.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's frame scalar admission and reuses each baseline inverse and deck corner for the entire scan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps fixed-size baselines and temporary samples only until the scan returns or refuses.

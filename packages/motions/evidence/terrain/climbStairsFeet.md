# src/terrain/climbStairsFeet.ts#climbStairsFeet

## @evidence contracts/development/common.md#meaningful-documentation

States preparation inputs, timebase, random-access query and bearing result.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the first tread contact strictly after the query, preserving the planted branch before toe-off and the original clamped clock-linear progress during swing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation pass per side precedes a binary interval lookup and at most one clearance-path evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains every footprint, clearance path, toe-off and contact time and keeps the last foot planted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear preparation and storage in footprints, logarithmic interval selection and constant-size evaluation per read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Footprints and the final clock are fixed for the plan, so each interval shares its resolved seconds and prepared clearance path.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader retains one interval per swing and releases those arrays with the climb plan; query history is not stored.

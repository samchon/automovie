# src/physics/restorePhysicalSimulationCheckpoint.ts#restorePhysicalSimulationCheckpoint

## @evidence contracts/development/common.md#meaningful-documentation

States checkpoint selection, interval indexing, borrowed versus copied records, partial destination failure and the returned world.

## @evidence contracts/development/implementation.md#principled-implementation

Restores every causal ledger through the selected interval and trims active contact sample prefixes to the controller checkpoint, preventing future samples from entering resumed history.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prefix copying precedes the final world restore; a fresh run returns a new world directly. Each ledger has one ordered pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

checkpointPhysicalSimulation establishes matching snapshot/controller entries and valid prefix counts before this helper. Elementwise append has no JavaScript call-argument limit; the helper does not silently truncate admitted history.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work is linear in visited frame and ledger populations plus copied byte/state size. Active episodes use a Map for constant-time expected receipt lookup rather than pairwise matching.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the selected world snapshot and causal prefix instead of rerunning those simulation steps; selection and sampled-input equivalence belong to checkpointPhysicalSimulation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All fallible copies finish before the world is built, and the returned world belongs to the run; copied state remains in the supplied cache and diagnostic arrays for that run's lifetime.

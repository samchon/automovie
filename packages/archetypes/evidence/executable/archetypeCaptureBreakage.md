# src/executable/archetypeCaptureBreakage.ts#archetypeCaptureBreakage

## @evidence contracts/development/common.md#meaningful-documentation

States empty-bottle threshold 40 J, authored momentum 0.2 kg m/s along X, initial height 1.2 m, one body fragment, retained remainder and the absence of fracture-work/impact/remainder dynamics.

## @evidence contracts/development/implementation.md#principled-implementation

The public broken call chooses producer fragments and p/M velocities. Engine projectileAt evolves those returned fragment velocities under standard gravity; one assembly preserves original shared coordinates and unchanged held remainder.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare one real bottle/break once; the subject returns the intact placed model before the event and an assembly of the remainder and publicly flown fragments afterward.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No surrogate shards, fixture-defined fracture sets, altered threshold, patched method, collision response or capture-only trajectory law replaces the producer/engine behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

One producer and split during preparation; each seek samples F constant-acceleration flights and merges the P part records in O(F+P) work, without retained frame history.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The split and per-fragment launch records are prepared once; all frames reuse the same source ownership and the engine's flight owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The subject retains one source bottle, its pieces and F scalar launch records; temporary assemblies belong to callers, and no renderer/process/handle is started.

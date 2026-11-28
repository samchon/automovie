# src/populationRuntime/AutoMovieEnginePopulationFormation.ts#AutoMovieEnginePopulationFormation.compileFormationStageMarks

## @evidence contracts/development/common.md#meaningful-documentation

The declaration gives the mark and interval coordinate frames, the required fixed layout, the sparse cue destination, and the malformed sets that fail during compilation. It identifies the separate shot, gait and clearance checks.

## @evidence contracts/development/implementation.md#principled-implementation

A mark is an absolute target in the unit frame. Subtracting the slot's local rest position makes the cue's offset reach that target after placement. The first cue starts from identity and each later cue carries the prior target and any facing left unspecified. The placement owner refuses an invalid slot before the compiler can assign a cue to it. Interval order, IDs, promoted actors, empty sets and non-finite displacements have independent checks.

## @evidence contracts/development/implementation.md#efficient-algorithms

The compiler keeps a set of authored IDs and indexes promoted slots once. It walks the input sets and marks in order and computes each marked slot's rest position on first use. Later marks reuse that rest position and the prior target. Local indexes are released on return and the caller receives fresh cue records.

# src/populationRuntime/AutoMovieEnginePopulationFormation.ts#AutoMovieEnginePopulationFormation.formationSlotPosition

## @evidence contracts/development/common.md#meaningful-documentation

Slot placement specifies world coordinates, anchor and heading, local reform and block order, and the integer interval enforced at entry.

## @evidence contracts/development/implementation.md#principled-implementation

Each admitted index identifies one discrete member. For a block it selects the local slot before block rotation and offset. An ordinary layout may blend two local positions before unit heading is applied. Terrain relief adds the height difference between the final XZ position and the anchor, preserving caller staging when no comparable support exists. Fractional and NaN indices fail before either calculation.

## @evidence contracts/development/implementation.md#efficient-algorithms

An ordinary layout computes the requested slot and at most two local points for a reform. A blocked layout walks its ordered block counts until it finds the owner. Terrain requires at most two ground-height reads and skips the datum if the slot has no ground. The operation retains no state between placement calls.

# src/actions/walkLegClearance.ts#walkLegClearance.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed-body premise and what reads the result.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the capsule owner, which builds the capsules, indices, readable pairs, toes offsets and placement readers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The clearance's public entry to the preparation its readings take, so a caller need not reach the capsule module.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds nothing to the capsule owner's preparation.

## @evidence contracts/development/implementation.md#efficient-algorithms

The capsule owner's linear preparation, once per search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every reading of one search shares the record; another body needs another.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the record and releases it with its search.

# src/actions/walkLegClearance.ts#walkLegClearance.excess

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and the zero.

## @evidence contracts/development/implementation.md#principled-implementation

The tangle audit's reading of every ordered pair of the two legs' segments, the probes it sets aside set aside; a pair whose bounding capsules keep apart holds its probes apart from the other's collider.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The capsule axes, a capsule test per ordered pair, then the placements and one depth reading per pair that may meet.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every ordered pair of the two legs is tested, and every pair that may meet is read against the audit's reference depths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixteen segment distances; only meeting segments are placed and only their readable probes are tested, each against the hulls whose bounding sphere holds it; a hull's face scan stops once the probe can no longer beat the deepest so far.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the preparation's capsules, indices, readable pairs and placement readers; one relative frame per meeting pair and one depth reader per visited shape serve all their probes.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Pair frames and shape readers release on return; nothing is retained.

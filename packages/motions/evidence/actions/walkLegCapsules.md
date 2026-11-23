# src/actions/walkLegCapsules.ts#walkLegCapsules.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed-body premise and every prepared member.

## @evidence contracts/development/implementation.md#principled-implementation

Builds each leg segment's capsule from its audit probes (`capsules`), the part indices, the toes-minus-foot rest offsets and HumanColliders' placement reader for each side's four leg bones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record owns everything a clearance reads per body, so each search owner builds it once and passes it down instead of every reading looking it up.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No capsule, probe, reference or placement is approximated; a body without a leg bone yields no capsule for it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the leg segments' probes for the capsules; a side's placement reader and each readable pair are built only when a reading first asks for them, each once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the body's capsules, indices, toes offsets, placement readers and each ordered pair's readable probes across every reading of one search; a different body needs another preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the record and releases it with its search; it holds at most two placement readers and one readable record per ordered pair of the body's parts, and no pose or reading.

# src/actions/walkLegCapsules.ts#walkLegCapsules.bones

## @evidence contracts/development/common.md#meaningful-documentation

States world frames, the posed leg, optional canonical demand, full default and output order.

## @evidence contracts/development/implementation.md#principled-implementation

Builds the four rigid leg frames from the posed joints and rotations; the toes sit at the foot-rotated rest offset from the ankle, flat with the foot, and demand omits only frames the collision reading does not read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolved-record constructor serves the thigh, shank, foot and toes records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pose fitting, contact, rotation or rest offset changes; absent demand returns all four records and absent names are not fabricated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work for four possible bones; the toes' rotated offset is computed only when the toes are requested.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the prepared rest offset and the caller's posed leg; no posed record is reused across legs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns a fresh bounded map and retains nothing.

# src/actions/walkLegCapsules.ts#walkLegCapsules.toes

## @evidence contracts/development/common.md#meaningful-documentation

States the prepared rest offset, the posed ankle and rotation, the world-metre output and the flat-toes convention.

## @evidence contracts/development/implementation.md#principled-implementation

Rotates the toes-minus-foot rest offset by the foot's quaternion and adds it to the ankle, the canonical rig resting unrotated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rigid-point expression serves both the collider bones and the capsule axes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No toes articulation, world pose or rotation convention is altered; every foot is transformed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work on a prepared offset.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the offset the preparation holds; no posed output is shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh point and retains nothing.

# src/actions/walkLegCapsules.ts#walkLegCapsules.prepareApart

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed and varying world-metre endpoints and the metre gap.

## @evidence contracts/development/implementation.md#principled-implementation

Ericson's closest points of two segments, with the first segment's direction and squared length computed once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

First-axis preparation precedes one second-axis reader; the pair-dependent cases live in one private function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Degenerate segments and parallel axes take Ericson's own branches, with endpoint clamps; every pair computes its gap.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation shares the first direction and squared length across the four segments of the other leg; each pair is constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One reading's broad phase holds the same axis endpoints throughout its nested loop; moved endpoints need a new reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each reader holds its origin, direction and squared length until its loop completes; no gap or pose is retained.

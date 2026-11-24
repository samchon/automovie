# src/posture/HumanArmSeedSpace.ts#HumanArmSeedSpace.ISpace

## @evidence contracts/development/common.md#meaningful-documentation

low and high: each coordinate's bounds, the arms' coordinates concatenated.

## @evidence contracts/development/design.md#principled-representation

The bounds are OMPL's RealVectorBounds the planner samples within.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmSeed.ts (seed, instant).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bounds come from the context's own ranges and rests.

# src/posture/HumanArmSeedSpace.ts#HumanArmSeedSpace.Bound

## @evidence contracts/development/common.md#meaningful-documentation

A coordinate's hard range as the context holds it, or null.

## @evidence contracts/development/design.md#principled-representation

An alias of the context's own element type, so the range has one definition.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmSeedSpace.ts (sampler).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No new representation: the context's.

# src/posture/HumanArmSeedSpace.ts#HumanArmSeedSpace.sampler

## @evidence contracts/development/common.md#meaningful-documentation

States the context and the space.

## @evidence contracts/development/implementation.md#principled-implementation

The space's own bounds, which OMPL's sampler draws uniformly within (StateSampler::sampleUniform; RealVectorStateSampler for the ranges, src/ompl/base/spaces/src/RealVectorStateSpace.cpp at 340bd214, BSD-3-Clause): the chart's two within its disc of radius R, handed on as a disc so no draw falls outside the domain; the other free coordinates over their ranges; fixed coordinates at their rests.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the arms' coordinates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bound of ours: R is the chart's reach of the rest and exit arms, as before.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(coordinates).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per seed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The space lives for the seed.

# src/posture/HumanArmSeedSpace.ts#HumanArmSeedSpace.split

## @evidence contracts/development/common.md#meaningful-documentation

States the concatenation and the arms' coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

Slices the concatenation by the arm's dimension count.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(coordinates).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new arrays.

# src/posture/HumanArmSeedSpace.ts#HumanArmSeedSpace.at

## @evidence contracts/development/common.md#meaningful-documentation

States the path, the share and the state.

## @evidence contracts/development/implementation.md#principled-implementation

The path's state where its time coordinate reaches the share, interpolated on the segment that holds it (StateSpace::interpolate).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan of the path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(path states).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array.

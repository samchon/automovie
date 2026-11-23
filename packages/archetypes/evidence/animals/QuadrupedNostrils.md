# src/animals/QuadrupedNostrils.ts#QuadrupedNostrils.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

Both members are dimensionless fractions with their admitted ranges.

## @evidence contracts/development/design.md#principled-representation

Fractions of the head keep the pair proportional to it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values the geometry reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedNostrils.ts#QuadrupedNostrils.IGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Metres in model space.

## @evidence contracts/development/design.md#principled-representation

Two centres and one radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `lay`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedNostrils.ts#QuadrupedNostrils.geometry

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

From the nose cap's centre, step back along the head by the authored fraction and out sideways so the sphere is internally tangent to the cap: the centre lies R minus r from the nose along the direction blended from the head's axis and its lateral axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, build the head's axes, place the pair.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Out-of-range fractions refuse.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by `lay`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh points and retains nothing.

# src/animals/QuadrupedNostrils.ts#QuadrupedNostrils.lay

## @evidence contracts/development/common.md#meaningful-documentation

States the parts laid and their zero share.

## @evidence contracts/development/implementation.md#principled-implementation

Two spheres at the geometry's centres; zero share since their volume is the head's own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One geometry read, two balls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No change to the head capsule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `geometry`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The builder owns the parts.

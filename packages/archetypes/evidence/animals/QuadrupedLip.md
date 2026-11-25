# src/animals/QuadrupedLip.ts#QuadrupedLip.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

Both members are dimensionless fractions with their admitted ranges.

## @evidence contracts/development/design.md#principled-representation

Fractions of the head keep the lip proportional to whatever head a species lays.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values the geometry reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No absolute size: the lip cannot outgrow the head it is laid in.

# src/animals/QuadrupedLip.ts#QuadrupedLip.IGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Metres in model space: the root, the free end and the radius.

## @evidence contracts/development/design.md#principled-representation

The capsule's two cap centres and radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the lay operation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedLip.ts#QuadrupedLip.geometry

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output frame and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The dorsal unit vector is world up with its component along the head axis removed. Offsetting the axis by R minus r along it makes the lip capsule internally tangent to the head capsule's upper side, so it lies inside the head at rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, build the head's axis and dorsal direction, offset both cap centres.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Out-of-range fractions refuse; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant vector arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by `lay`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh points and retains nothing.

# src/animals/QuadrupedLip.ts#QuadrupedLip.lay

## @evidence contracts/development/common.md#meaningful-documentation

States the part laid, its geometry owner and its zero share.

## @evidence contracts/development/implementation.md#principled-implementation

One capsule from root to tip; its share is zero because its volume is the head capsule's own, already weighed by the head's source share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One geometry read and one rod.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No second weighing of the head's tissue and no change to the head capsule.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `geometry`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The builder owns the part.

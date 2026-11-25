# src/animals/QuadrupedCorner.ts#QuadrupedCorner.Clear

## @evidence contracts/development/common.md#meaningful-documentation

States the point and the reach in metres and the returned point.

## @evidence contracts/development/design.md#principled-representation

A function from a world point and a reach to the cleared point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one shape `QuadrupedCorner` takes and returns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedCorner.ts#QuadrupedCorner.of

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the identity case.

## @evidence contracts/development/implementation.md#principled-implementation

Two planes abutting along a bound meet at an edge; it is concave when the plane on the bound's low side falls toward it more steeply than the plane on its high side, so the surface turns upward across it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the plane under the foothold, test each abutting plane along each axis, move off each concave edge in reach.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foothold is moved only along its own plane and never past another edge it then reaches; convex edges are left alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

Quadratic in the few planes per foothold.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The scene's own planes and bounds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the caller's scene.

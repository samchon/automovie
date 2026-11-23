# src/physics/limitPhysicalSwingTwist.ts#limitPhysicalSwingTwist

## @evidence contracts/development/common.md#meaningful-documentation

States the decomposition, both limits and the radial projection.

## @evidence contracts/development/implementation.md#principled-implementation

The swing-twist decomposition about a fixed axis and the elliptic swing cone of Baerlocher and Boulic; the swing is projected along its own direction, which keeps the swing plane and is exact on the cone's axes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Decompose, limit each part, recompose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ranges are the limit's; a rotation within them is unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh rotation; retains nothing.

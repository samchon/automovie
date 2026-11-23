# src/internal/mesh-observations/planeFrame.ts#planeFrame

## @evidence contracts/development/implementation.md#principled-implementation

Projection of the reference onto the normal-orthogonal plane and cross products construct a right-handed orthonormal frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Normal and reference degeneracies are rejected where their physical meaning is owned.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.

## @evidence contracts/development/common.md#meaningful-documentation

States the operation, physical interpretation and its documented degeneracy or ownership limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant vector arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call depends directly on its arguments; no retained cache or effectful shared work exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a frame with fresh axis triples and retains no global state.

# src/reaction/staggerTransfer.ts#staggerTransfer

## @evidence contracts/development/common.md#meaningful-documentation

States the course, the equation, its exact solution, the frames and the clamp.

## @evidence contracts/development/implementation.md#principled-implementation

The linear inverted pendulum driven by a polynomial centre of pressure has the terminating particular solution of the operator series, plus the homogeneous cosh/sinh part fixed by the initial state.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The quintic's derivatives, the particular solution, the homogeneous coefficients, the state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact for the course it states; no time step.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per read, replacing one held span per `STEP` of the weight shift.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The pendulum's advance and its course readers both read the span through this one owner.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh vectors and retains nothing.

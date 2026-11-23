# src/physics/preparePhysicalContactBindingRows.ts#preparePhysicalContactBindingRows

## @evidence contracts/development/common.md#meaningful-documentation

States the pair of endpoint reads and common nonlinear and local-model ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps the native shape witnesses, initial world start, receiver-local feature and signed residuals of the existing binding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both endpoint readers are acquired once. Contact and separation each own a single residual expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the admitted collider shape selectors, compression, weighting and geometry checks for both reference modes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Row keys limit probes to moving dependencies. The memoized scalar owners share a geometry reading when their endpoints agree.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same contact and separation formulas serve fixed receivers and candidate peers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each row captures its two endpoints and local witnesses during one fit.

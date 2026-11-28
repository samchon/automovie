# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The request documents the reusable compressed stencil, finite XYZ targets, the free mask, and distinct borrowed and writable buffers.

## @evidence contracts/development/design.md#principled-representation

The kernel initializes both writable arrays from targets, updates free vertices by Jacobi sweeps, measures final controls and copies them back if the alternating buffers end reversed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller supplies previously admitted storage and retains it. The kernel allocates no solve buffers and exposes only the residual.

# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IProps.stencil

## @evidence contracts/development/common.md#meaningful-documentation

The reusable row table defines count, neighbor identity and weights for the limit equations.

# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IProps.targets

## @evidence contracts/development/common.md#meaningful-documentation

The borrowed finite XYZ values supply the right-hand side and scale the residual threshold.

# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IProps.free

## @evidence contracts/development/common.md#meaningful-documentation

A zero holds the control at its target and any nonzero entry permits updates.

# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IProps.positions

## @evidence contracts/development/common.md#meaningful-documentation

The writable output needs three scalars per vertex and storage distinct from both scratch and targets.

# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IProps.scratch

## @evidence contracts/development/common.md#meaningful-documentation

The second writable buffer alternates with positions and has unspecified contents on return.

# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IPropsScratch

## @evidence contracts/development/common.md#meaningful-documentation

The record documents writable slots and minimum capacity for separate scratch storage.

## @evidence contracts/development/design.md#principled-representation

The solver writes target values and subsequent Jacobi steps by scalar index and does not detect overlap or resize the caller's storage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The buffer needs indexed writes and capacity only, allowing array-backed or typed implementation.

# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IPropsScratch.length

## @evidence contracts/development/common.md#meaningful-documentation

Capacity is at least three times the stencil vertex count.

# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IPropsPositions

## @evidence contracts/development/common.md#meaningful-documentation

The record documents writable output slots and minimum capacity for packed coordinates.

## @evidence contracts/development/design.md#principled-representation

The solver writes each coordinate in XYZ order and copies the final active buffer into these slots when required.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller retains the supplied output buffer and the kernel returns only numerical residual.

# src/geometry/IAutoMovieSolveSubdivisionLimit.ts#IAutoMovieSolveSubdivisionLimit.IPropsPositions.length

## @evidence contracts/development/common.md#meaningful-documentation

Capacity is at least three scalars per stencil vertex so final XYZ controls all fit.

# src/geometry/IAutoMovieFitSubdivisionLimit.ts#IAutoMovieFitSubdivisionLimit.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The type distinguishes source quad topology, finite target positions and an optional pin mask, with the result carrying the reached residual.

## @evidence contracts/development/design.md#principled-representation

The wrapper creates limit rows and a free mask, allocates separate buffers and delegates the remaining solve to solveSubdivisionLimit. Target finiteness is a caller premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This one-shot input owns reusable quad topology, targets and pin intent. It need not expose scratch storage.

# src/geometry/IAutoMovieFitSubdivisionLimit.ts#IAutoMovieFitSubdivisionLimit.IProps.faces

## @evidence contracts/development/common.md#meaningful-documentation

The borrowed rows describe four consistently wound original vertex ordinals per polygon and a manifold support premise.

# src/geometry/IAutoMovieFitSubdivisionLimit.ts#IAutoMovieFitSubdivisionLimit.IProps.targets

## @evidence contracts/development/common.md#meaningful-documentation

The packed finite triples define the target unit and population. The empty case yields no controls and zero residual.

# src/geometry/IAutoMovieFitSubdivisionLimit.ts#IAutoMovieFitSubdivisionLimit.IProps.pinned

## @evidence contracts/development/common.md#meaningful-documentation

True keeps a control at its target. Absent entries default to free and surplus entries are ignored.

# src/geometry/IAutoMovieFitSubdivisionLimit.ts#IAutoMovieFitSubdivisionLimit.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The return states caller ownership of solved controls and the measured free-vertex residual, including behavior at the iteration cap.

## @evidence contracts/development/design.md#principled-representation

The solver measures the residual of the final returned positions after the last permitted update and returns it even when the tolerance was missed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The output reports control coordinates and outcome quality. Tolerance acceptance belongs to the caller.

# src/geometry/IAutoMovieFitSubdivisionLimit.ts#IAutoMovieFitSubdivisionLimit.IResult.positions

## @evidence contracts/development/common.md#meaningful-documentation

The new XYZ buffer retains target-frame units and preserves held coordinates.

# src/geometry/IAutoMovieFitSubdivisionLimit.ts#IAutoMovieFitSubdivisionLimit.IResult.residual

## @evidence contracts/development/common.md#meaningful-documentation

The final maximum Euclidean free-vertex misfit uses the target length unit and is zero for no free vertices.

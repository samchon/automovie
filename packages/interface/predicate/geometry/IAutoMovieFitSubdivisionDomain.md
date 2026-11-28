# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The domain defines metre controls, per-vertex anchors and independently optional target rows, and describes its fixed surrounding support.

## @evidence contracts/development/design.md#principled-representation

The fitter checks finite vertex-aligned controls and targets and safe region face ordinals. It builds two levels of affine rows and solves independent coordinate systems. It refuses nonfinite solved values or residuals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The request owns one prepared local solve. Broader support and physical measurement remain with the joined surface owner.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IProps.cage

## @evidence contracts/development/common.md#meaningful-documentation

The source quad cage carries pre-inverse samples and original pinned controls in a shared local metre frame.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IProps.controlPositions

## @evidence contracts/development/common.md#meaningful-documentation

The array gives existing joined control triples in the same vertex order and unit as cage.positions.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IProps.anchors

## @evidence contracts/development/common.md#meaningful-documentation

One boolean per original vertex decides whether to hold its coarse control at the supplied coordinate.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IProps.limitTargets

## @evidence contracts/development/common.md#meaningful-documentation

One triple or null per source vertex supplies a limit constraint independently of its control anchor.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IProps.regionFaces

## @evidence contracts/development/common.md#meaningful-documentation

Original integer face ordinals identify the allowed change region while exterior controls stay fixed.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The return distinguishes new refined geometry from coarse controls and coordinate-solve telemetry.

## @evidence contracts/development/design.md#principled-representation

The owner completes three solves, composes detail with the two-step original refinement and records maximum row violation. The residual measures algebraic fitting rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result contains one generating level and its actual coarse controls, with numerical telemetry for the caller's separate validation.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IResult.level

## @evidence contracts/development/common.md#meaningful-documentation

The two-step local-metre generating level can proceed to limit evaluation directly.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IResult.coarseControls

## @evidence contracts/development/common.md#meaningful-documentation

The solved packed original XYZ controls are returned in source order before the detail transform.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IResult.maximumEqualityError

## @evidence contracts/development/common.md#meaningful-documentation

The maximum metre-valued row violation includes authored equalities and normalized bending lifting rows.

# src/geometry/IAutoMovieFitSubdivisionDomain.ts#IAutoMovieFitSubdivisionDomain.IResult.iterations

## @evidence contracts/development/common.md#meaningful-documentation

The three counts correspond to the independent X, Y and Z solver calls.

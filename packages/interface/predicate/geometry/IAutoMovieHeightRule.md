# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule

## @evidence contracts/development/common.md#meaningful-documentation

The union documents metre-valued world height at an XZ query. Its footprint and walkability stay on the containing surface. The Engine's `surfaceHeightAt` evaluates a rule directly, and `AutoMovieEngineWorld.groundSurface` selects a world footprint before `groundHeight` reads it.

## @evidence contracts/development/design.md#principled-representation

The union gives each existing kind a named variant with the fields required by that evaluator. The public field projection preserves discrimination and the existing dictionary assignment of each variant. The containing surface owns bounds. The Engine scene validator checks the variant's numerical preconditions before returning diagnostics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scene surfaces, world surfaces and prepared height queries share one rule. Both world and scene height readers reach the Engine's `surfaceHeightAt`. The rule carries only coefficients or samples. Surface identities, footprint vertices, and walkability stay with their respective containing records.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IConstant

## @evidence contracts/development/common.md#meaningful-documentation

The variant identifies the constant reading and gives the one required finite world Y value in metres. At any XZ point, the Engine reader returns the stored `value` directly.

## @evidence contracts/development/design.md#principled-representation

The `constant` tag requires the one value returned by the Engine. `AutoMovieEngineWorld.terrain` copies the provided height into this field. The Engine's `validateSurfaceHeightRule` reports a range violation at `value` when that field is nonfinite.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Flat terrain construction and prepared support height queries need one scalar. Position, samples and slopes would have no role in this evaluation. The containing surface supplies the footprint used by ground selection.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IPlane

## @evidence contracts/development/common.md#meaningful-documentation

The variant documents the exact sum read by `surfaceHeightAt` and identifies the origin height in metres. Each slope is a rise in metres per metre on its corresponding positive world axis.

## @evidence contracts/development/design.md#principled-representation

The `plane` tag requires the offset and both signed slopes, including zero where the plane is constant in one direction. `AutoMovieEngineWorld.ramp` derives these coefficients from a representable span and checks the resulting origin and endpoint height. `validateSurfaceHeightRule` checks each resident coefficient for finiteness in the caller's validation path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each stored coefficient contributes to world height. The constructed ramp's centreline, width and footprint are resolved by the world ramp builder and live outside the coefficients used by the reader.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IHeightfield

## @evidence contracts/development/common.md#meaningful-documentation

The variant describes the origin, pitch, sample count and row-major order in world metres. Its interpolation and edge rules agree with `AutoMovieEngineWorld.surfaceHeight`. The builder establishes representable knots and finite callback samples in increasing row then column order.

## @evidence contracts/development/design.md#principled-representation

The `heightfield` tag requires two axis origins, pitches and counts, together with a flat sample list. `AutoMovieEngineWorld.heightfield` allocates the stated rectangular lattice before invoking the callback and checks distinct finite knots and finite heights during construction. Scene admission checks origins, positive finite pitch and safe counts. It checks the resident shape and scans the knots and samples once the sample count agrees with the header.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The header reconstructs lattice positions without storing triangles or XZ coordinates per sample. The Engine height reader addresses four samples in row-major order. Terrain tessellation uses the same header to split support geometry at lattice knots, and the containing surface keeps the footprint and traversal decision.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IConstant.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the exact tag consumed by the Engine's constant branch and written by world terrain construction.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IConstant.value

## @evidence contracts/development/common.md#meaningful-documentation

Documents finite world Y in metres. The Engine returns this stored scalar directly and reports a range violation when it is nonfinite.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IPlane.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the tag used by world ramp construction and the shared Engine reader to select the plane calculation.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IPlane.originHeight

## @evidence contracts/development/common.md#meaningful-documentation

The documented value is the intercept at world X and Z zero, in metres. The Engine uses it as the first term of the plane sum.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IPlane.slopeX

## @evidence contracts/development/common.md#meaningful-documentation

The member's rise per metre of positive world X corresponds to the `slopeX * x` term of the Engine calculation.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IPlane.slopeZ

## @evidence contracts/development/common.md#meaningful-documentation

The member's rise per metre of positive world Z corresponds to the `slopeZ * z` term of the Engine calculation.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IHeightfield.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the tag stored by the world heightfield builder and directs the reader to its sampled lattice.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IHeightfield.originX

## @evidence contracts/development/common.md#meaningful-documentation

Documents the world-metre X position of column zero. The Engine forms each X knot from this origin plus the column index times its spacing.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IHeightfield.originZ

## @evidence contracts/development/common.md#meaningful-documentation

Documents the world-metre Z position of row zero. The Engine forms each Z knot from this origin plus the row index times its spacing.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IHeightfield.spacingX

## @evidence contracts/development/common.md#meaningful-documentation

Specifies a positive finite metre pitch for the X lattice axis. Scene admission checks the pitch and its distinct representable knots.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IHeightfield.spacingZ

## @evidence contracts/development/common.md#meaningful-documentation

Specifies a positive finite metre pitch for the Z lattice axis. Scene admission checks the Z pitch and its distinct representable knots.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IHeightfield.columns

## @evidence contracts/development/common.md#meaningful-documentation

Defines the safe integer count of X sample points with minimum two. The Engine uses it both to bound the X query and to step between sample rows.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IHeightfield.rows

## @evidence contracts/development/common.md#meaningful-documentation

Defines the safe integer count of Z sample points with minimum two. The Engine uses it to bound the Z query and determine the complete sample count.

# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule.IHeightfield.samples

## @evidence contracts/development/common.md#meaningful-documentation

Defines world Y values in metres and their row-major indexing. The Engine requires the header's exact count and finite values at every sample index.

# src/drawing/IAutoMovieOpeningExtent.ts#IAutoMovieOpeningExtent

## @evidence contracts/development/design.md#principled-representation

IResult reports face-local hull spans in metres, whose numerical validity depends on admitted profile geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nominal opening sizing reuses this result for profile-based marks and schedule dimensions; world fill measurements have a distinct frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hull convention remains explicit for tilted arcs instead of claiming exact arc spans or usable clearance.

## @evidence contracts/development/common.md#meaningful-documentation

IResult identifies face axes, grid rounding, hull scope and ownership.

# src/drawing/IAutoMovieOpeningExtent.ts#IAutoMovieOpeningExtent.IResult

## @evidence contracts/development/design.md#principled-representation

Width and height measure the profile hull's face-local x/y spans in metres. Nonnegative finite values depend on valid nonempty geometry and representable arithmetic, which this number pair cannot enforce.

## @evidence contracts/development/design.md#minimal-and-owned-surface

autoMovieOpeningNominalExtent adds measurement basis to this same pair for both opening marks and schedule rows; no page projection or world orientation is encoded here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reported hull matches the wall-cut bound even when a tilted arc has a smaller exact span; the dimensions are not a collision or traversal clearance certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States face-local axes, metres, rounding, hull approximation, validation premises and result ownership.

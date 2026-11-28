# src/geometry/IAutoMovieSplitContourLeaf64.ts#IAutoMovieSplitContourLeaf64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result describes a strict interior source split, independent child chord qualification and inherited ancestry.

## @evidence contracts/development/design.md#principled-representation

The owner converts the requested phase to local t, splits the underlying Bernstein net and qualifies each child against its own chord at the supplied tolerance. The returned point copies the exact split endpoint before later refinement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result owns the split point and explicit retained leaves on both sides. It preserves the source parameter intervals rather than introducing a new domain.

# src/geometry/IAutoMovieSplitContourLeaf64.ts#IAutoMovieSplitContourLeaf64.IResult.point

## @evidence contracts/development/common.md#meaningful-documentation

The copied source-millimetre point is the Bernstein split endpoint and can have independent tuple identity from the child controls.

# src/geometry/IAutoMovieSplitContourLeaf64.ts#IAutoMovieSplitContourLeaf64.IResult.before

## @evidence contracts/development/common.md#meaningful-documentation

Increasing retained restrictions cover the original start through the requested phase.

# src/geometry/IAutoMovieSplitContourLeaf64.ts#IAutoMovieSplitContourLeaf64.IResult.after

## @evidence contracts/development/common.md#meaningful-documentation

Increasing retained restrictions cover the requested phase through the original end.

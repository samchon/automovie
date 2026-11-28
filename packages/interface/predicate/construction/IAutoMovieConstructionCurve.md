# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the observed source, units and actual geometry of each kind.

## @evidence contracts/development/design.md#principled-representation

SampleConstructionCurves selects the matching realized surface, reads rings and derives section, guide and centroid polylines in the chain's order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record contains just the sampled data needed to draw an inspection mark. The original surface retains geometry ownership.

# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve.id

## @evidence contracts/development/common.md#meaningful-documentation

The comment documents identifier forms and the owning indices.

# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve.kind

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the three inspection line meanings.

# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve.part

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the producer that the reader and diagnostics share.

# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve.closed

## @evidence contracts/development/common.md#meaningful-documentation

The comment links the flag to the drawing closure and selected geometry.

# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve.points

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives packed coordinate order, units and closing convention.

# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve.flagged

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the actual diagnostic source for the flag.

# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the geometric relationships that each literal displays.

## @evidence contracts/development/design.md#principled-representation

The sampler constructs principal sections, four quarter guides and one axis separately from the same realized ring samples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tag lets drawing assign its category styling without inspecting the authored tree.

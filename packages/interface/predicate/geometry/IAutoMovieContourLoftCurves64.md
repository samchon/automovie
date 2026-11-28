# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Curve

## @evidence contracts/development/common.md#meaningful-documentation

The chart identifies a borrowed cyclic millimetre point array and its closure-inclusive length prefixes.

## @evidence contracts/development/design.md#principled-representation

The constructor accumulates each chord, including the last-to-first edge. Its point reader wraps normalized phase and searches those prefixes before linear interpolation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The chart keeps one polygon and one length table for polygon sampling and correspondence. The source cubic representation remains separate.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Curve.points

## @evidence contracts/development/common.md#meaningful-documentation

The borrowed cyclic samples preserve polygon order and physical millimetres. Keep the array stable while reading the precomputed prefixes.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Curve.cumulative

## @evidence contracts/development/common.md#meaningful-documentation

The prefix array starts at zero and ends after the closing edge.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Curve.length

## @evidence contracts/development/common.md#meaningful-documentation

The final prefix gives total closed-polygon chord length in millimetres.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Knot

## @evidence contracts/development/common.md#meaningful-documentation

The record describes an evaluated point, inherited source phase and optional outgoing restriction.

## @evidence contracts/development/design.md#principled-representation

Cubic sampling copies each retained leaf's first point and source phase into a knot. The generator uses that phase for ring-specific physical identity and tracks its outgoing leaf if present.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A knot carries the sampled coordinate and its source address. Original coefficients and subsequent mesh indices belong to their respective owners.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Knot.p

## @evidence contracts/development/common.md#meaningful-documentation

The tuple gives the actual sampled position in source millimetres.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Knot.phase

## @evidence contracts/development/common.md#meaningful-documentation

The value preserves the source primitive's declared phase at that sample.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Knot.leaf

## @evidence contracts/development/common.md#meaningful-documentation

The optional restriction identifies the forward source span used for refinement. A construction-only diagnostic knot has none.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Leaf

## @evidence contracts/development/common.md#meaningful-documentation

The record explains phase limits and eager or compact representation, including cached materialization and adaptive depth.

## @evidence contracts/development/design.md#principled-representation

The Engine replays half choices from the original cubic until it has the restriction, then caches its coefficients. Partitioning checks child chord bounds and retains inherited phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The leaf owns one source restriction. Compact storage keeps original coefficients and path metadata until the materializer needs a net.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Leaf.net

## @evidence contracts/development/common.md#meaningful-documentation

An explicit or materialized Bernstein net is kept on the leaf. The accessor returns that cached array directly.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Leaf.original

## @evidence contracts/development/common.md#meaningful-documentation

The optional readonly source cubic supplies the exact ancestor for replaying the compact path.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Leaf.path

## @evidence contracts/development/common.md#meaningful-documentation

The high-to-low binary choices select left or right halves, with leading zero choices implied by the depth.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Leaf.start

## @evidence contracts/development/common.md#meaningful-documentation

The inclusive phase addresses the first control in the original source chart.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Leaf.end

## @evidence contracts/development/common.md#meaningful-documentation

The inclusive phase addresses the final control before closed sampling removes constant leaves.

# src/geometry/IAutoMovieContourLoftCurves64.ts#IAutoMovieContourLoftCurves64.Leaf.depth

## @evidence contracts/development/common.md#meaningful-documentation

The depth includes inherited splits. Compact paths are limited to 30 steps and already qualified explicit restrictions can be deeper.

# src/core/math/IAutoMovieHullEdge.ts#IAutoMovieHullEdge

## @evidence contracts/development/design.md#principled-representation

Records the edge minimising the planar point-to-segment distance over the hull's boundary, the hinge `detectSupportToppling` reports for a centre of mass outside the hull; it premises a hull listed in boundary order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two endpoints and the distance, what the toppling check and `pointHullDistance` read; no edge index is kept because no consumer needs it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A plain result record with no caller-specific field; the single-vertex answer is the stated degenerate case, not a compensation.

## @evidence contracts/development/common.md#meaningful-documentation

States what the edge means for toppling, that distance is planar in XZ, that endpoints alias the hull's vertices, and the single-vertex case.
